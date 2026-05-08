import { useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, AlertTriangle, Users, Clock, Calendar,
  Target, Zap, ArrowUpRight, BarChart3, Activity, Brain,
  ThermometerSun, DollarSign, UserMinus, Lightbulb, Loader2
} from 'lucide-react';
import { supabase, fetchAllRows } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SmartAnalyticsProps {
  facilityId: string | null;
}

interface DeadSpot {
  day: string;
  hour: number;
  avgBookings: number;
  potentialRevenue: number;
}

interface PlayerInsight {
  id: string;
  name: string;
  email: string;
  bookingsLastMonth: number;
  bookingsThisMonth: number;
  trend: 'rising' | 'declining' | 'stable' | 'churning';
  preferredTime: string;
  preferredDay: string;
  avgSpend: number;
  lastSeen: string;
}

interface PeakHour {
  hour: number;
  avgBookings: number;
  revenue: number;
  utilization: number;
}

interface AnalyticsData {
  deadSpots: DeadSpot[];
  peakHours: PeakHour[];
  atRiskPlayers: PlayerInsight[];
  topPlayers: PlayerInsight[];
  weeklyTrend: { week: string; bookings: number; revenue: number }[];
  recommendations: string[];
  overallScore: number;
  courtEfficiency: number;
  memberRetention: number;
  revenueGrowth: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SmartAnalytics({ facilityId }: SmartAnalyticsProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    deadSpots: [],
    peakHours: [],
    atRiskPlayers: [],
    topPlayers: [],
    weeklyTrend: [],
    recommendations: [],
    overallScore: 0,
    courtEfficiency: 0,
    memberRetention: 0,
    revenueGrowth: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'deadspots' | 'players' | 'predictions'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [facilityId]);

  const fetchAnalytics = async () => {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(today);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Fetch all bookings from last 60 days for trend analysis (paginated)
      const bookingsData = await fetchAllRows(() => supabase
        .from('court_availability_blocks')
        .select('block_date, start_time, end_time, court_id, notes, courts(name, hourly_rate)')
        .eq('block_type', 'reservation')
        .gte('block_date', sixtyDaysAgo.toISOString().split('T')[0])
        .order('block_date', { ascending: true }));
      const bookings = bookingsData;

      const { data: courts } = await supabase
        .from('courts')
        .select('id, name, hourly_rate');

      const totalCourts = courts?.length || 1;
      const allBookings = bookings || [];
      const thirtyDayStr = thirtyDaysAgo.toISOString().split('T')[0];

      // --- DEAD SPOT ANALYSIS ---
      const heatmap: Record<string, number[]> = {};
      DAYS.forEach(day => { heatmap[day] = new Array(17).fill(0); });

      const recentBookings = allBookings.filter(b => b.block_date >= thirtyDayStr);
      const olderBookings = allBookings.filter(b => b.block_date < thirtyDayStr);

      recentBookings.forEach(b => {
        const date = new Date(b.block_date + 'T00:00:00');
        const dayName = DAYS[date.getDay()];
        const hour = parseInt(b.start_time.split(':')[0]);
        if (hour >= 6 && hour <= 22) {
          heatmap[dayName][hour - 6]++;
        }
      });

      const weeksInPeriod = 4.3;
      const avgHourlyRate = courts?.reduce((sum, c) => sum + Number(c.hourly_rate || 0), 0) / totalCourts || 30;

      const deadSpots: DeadSpot[] = [];
      DAYS.forEach(day => {
        for (let h = 6; h <= 22; h++) {
          const avg = heatmap[day][h - 6] / weeksInPeriod;
          const maxPossible = totalCourts;
          if (avg < maxPossible * 0.3) {
            deadSpots.push({
              day,
              hour: h,
              avgBookings: avg,
              potentialRevenue: (maxPossible - avg) * avgHourlyRate,
            });
          }
        }
      });

      deadSpots.sort((a, b) => b.potentialRevenue - a.potentialRevenue);

      // --- PEAK HOURS ---
      const hourlyTotals: { bookings: number; count: number }[] = new Array(17).fill(null).map(() => ({ bookings: 0, count: 0 }));
      recentBookings.forEach(b => {
        const hour = parseInt(b.start_time.split(':')[0]);
        if (hour >= 6 && hour <= 22) {
          hourlyTotals[hour - 6].bookings++;
          hourlyTotals[hour - 6].count++;
        }
      });

      const peakHours: PeakHour[] = hourlyTotals.map((h, i) => ({
        hour: i + 6,
        avgBookings: h.bookings / weeksInPeriod,
        revenue: (h.bookings / weeksInPeriod) * avgHourlyRate,
        utilization: ((h.bookings / weeksInPeriod) / totalCourts) * 100,
      })).sort((a, b) => b.utilization - a.utilization);

      // --- PLAYER TENDENCY ANALYSIS ---
      const playerBookings: Record<string, { recent: number; older: number; times: number[]; days: number[] }> = {};

      recentBookings.forEach(b => {
        const name = b.notes || 'Unknown';
        if (!playerBookings[name]) playerBookings[name] = { recent: 0, older: 0, times: [], days: [] };
        playerBookings[name].recent++;
        playerBookings[name].times.push(parseInt(b.start_time.split(':')[0]));
        const date = new Date(b.block_date + 'T00:00:00');
        playerBookings[name].days.push(date.getDay());
      });

      olderBookings.forEach(b => {
        const name = b.notes || 'Unknown';
        if (!playerBookings[name]) playerBookings[name] = { recent: 0, older: 0, times: [], days: [] };
        playerBookings[name].older++;
      });

      const playerInsights: PlayerInsight[] = Object.entries(playerBookings)
        .filter(([name]) => name !== 'Unknown' && name !== 'Reserved')
        .map(([name, data]) => {
          const avgTime = data.times.length > 0
            ? Math.round(data.times.reduce((s, t) => s + t, 0) / data.times.length)
            : 12;
          const avgDay = data.days.length > 0
            ? Math.round(data.days.reduce((s, d) => s + d, 0) / data.days.length)
            : 3;

          let trend: 'rising' | 'declining' | 'stable' | 'churning' = 'stable';
          if (data.recent > data.older * 1.3) trend = 'rising';
          else if (data.recent < data.older * 0.5) trend = 'declining';
          else if (data.older > 2 && data.recent === 0) trend = 'churning';

          return {
            id: name,
            name,
            email: '',
            bookingsLastMonth: data.older,
            bookingsThisMonth: data.recent,
            trend,
            preferredTime: `${avgTime}:00`,
            preferredDay: DAYS[avgDay] || 'Wednesday',
            avgSpend: data.recent * avgHourlyRate,
            lastSeen: '',
          };
        });

      const atRiskPlayers = playerInsights
        .filter(p => p.trend === 'declining' || p.trend === 'churning')
        .sort((a, b) => b.bookingsLastMonth - a.bookingsLastMonth)
        .slice(0, 10);

      const topPlayers = playerInsights
        .sort((a, b) => b.bookingsThisMonth - a.bookingsThisMonth)
        .slice(0, 10);

      // --- WEEKLY TREND ---
      const weeklyMap: Record<string, { bookings: number; revenue: number }> = {};
      allBookings.forEach(b => {
        const date = new Date(b.block_date + 'T00:00:00');
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const key = weekStart.toISOString().split('T')[0];
        if (!weeklyMap[key]) weeklyMap[key] = { bookings: 0, revenue: 0 };
        weeklyMap[key].bookings++;
        weeklyMap[key].revenue += avgHourlyRate;
      });

      const weeklyTrend = Object.entries(weeklyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, data]) => ({ week, ...data }));

      // --- SCORES ---
      const totalSlots = totalCourts * 17 * 7 * weeksInPeriod;
      const courtEfficiency = Math.min((recentBookings.length / totalSlots) * 100, 100);

      const returningPlayers = playerInsights.filter(p => p.bookingsThisMonth > 0 && p.bookingsLastMonth > 0).length;
      const totalActivePlayers = playerInsights.filter(p => p.bookingsLastMonth > 0).length;
      const memberRetention = totalActivePlayers > 0 ? (returningPlayers / totalActivePlayers) * 100 : 0;

      const recentRevenue = recentBookings.length * avgHourlyRate;
      const olderRevenue = olderBookings.length * avgHourlyRate;
      const revenueGrowth = olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 : 0;

      const overallScore = Math.round((courtEfficiency * 0.4 + memberRetention * 0.3 + Math.min(Math.max(revenueGrowth + 50, 0), 100) * 0.3));

      // --- RECOMMENDATIONS ---
      const recommendations: string[] = [];
      if (deadSpots.length > 5) {
        const topDead = deadSpots[0];
        recommendations.push(`${topDead.day}s at ${topDead.hour}:00 has $${Math.round(topDead.potentialRevenue).toLocaleString()}/week in untapped revenue. Consider a promo or open play session.`);
      }
      if (atRiskPlayers.length > 3) {
        recommendations.push(`${atRiskPlayers.length} members are showing declining activity. A re-engagement email with a discount could bring them back.`);
      }
      if (courtEfficiency < 40) {
        recommendations.push(`Court utilization is only ${courtEfficiency.toFixed(0)}%. Try dynamic pricing — lower rates for off-peak hours to fill empty courts.`);
      }
      if (peakHours[0]?.utilization > 90) {
        recommendations.push(`Your peak hours are nearly full (${peakHours[0].utilization.toFixed(0)}% at ${peakHours[0].hour}:00). Consider premium pricing during these slots.`);
      }
      if (topPlayers.length > 0 && topPlayers[0].bookingsThisMonth > 8) {
        recommendations.push(`Your top player "${topPlayers[0].name}" books ${topPlayers[0].bookingsThisMonth}x/month. Reward loyalty with a VIP tier to lock in retention.`);
      }
      if (recommendations.length === 0) {
        recommendations.push('Your facility is performing well! Keep monitoring trends weekly for optimization opportunities.');
      }

      setData({
        deadSpots: deadSpots.slice(0, 20),
        peakHours: peakHours.slice(0, 10),
        atRiskPlayers,
        topPlayers,
        weeklyTrend,
        recommendations,
        overallScore,
        courtEfficiency,
        memberRetention,
        revenueGrowth,
      });
    } catch (error) {
      console.error('Error computing analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
        <p className="text-sm text-slate-500" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Analyzing booking patterns...
        </p>
      </div>
    );
  }

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}${period}`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'deadspots', label: 'Dead Spots', icon: <ThermometerSun className="w-4 h-4" /> },
    { id: 'players', label: 'Player Intel', icon: <Users className="w-4 h-4" /> },
    { id: 'predictions', label: 'Recommendations', icon: <Lightbulb className="w-4 h-4" /> },
  ];

  const cardStagger = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  const tabContentVariants = {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, x: -12, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              className="text-2xl font-bold text-slate-900 tracking-tight"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Smart Analytics
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white uppercase tracking-wider">
              AI
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Pattern recognition &amp; revenue optimization insights
          </p>
        </div>
      </div>

      {/* Tab Navigation - Pill style */}
      <div className="relative flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 z-10 ${
              activeTab === tab.id
                ? 'text-green-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                style={{ borderBottom: '2px solid rgb(22 163 74)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content with AnimatePresence */}
      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Facility Score',
                  value: data.overallScore,
                  suffix: '/100',
                  icon: <Brain className="w-5 h-5" />,
                  color: 'green',
                  description: 'Overall performance',
                },
                {
                  label: 'Court Efficiency',
                  value: Math.round(data.courtEfficiency),
                  suffix: '%',
                  icon: <Target className="w-5 h-5" />,
                  color: 'teal',
                  description: 'Slot utilization rate',
                },
                {
                  label: 'Member Retention',
                  value: Math.round(data.memberRetention),
                  suffix: '%',
                  icon: <Users className="w-5 h-5" />,
                  color: 'sky',
                  description: 'Returning players',
                },
                {
                  label: 'Revenue Trend',
                  value: data.revenueGrowth > 0 ? `+${data.revenueGrowth.toFixed(0)}` : data.revenueGrowth.toFixed(0),
                  suffix: '%',
                  icon: data.revenueGrowth >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />,
                  color: data.revenueGrowth >= 0 ? 'emerald' : 'red',
                  description: 'vs previous 30 days',
                },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  custom={i}
                  variants={cardStagger}
                  initial="hidden"
                  animate="visible"
                >
                  <ScoreCard {...card} />
                </motion.div>
              ))}
            </div>

            {/* Weekly Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-slate-900">Weekly Booking Trend</h3>
                <span className="text-xs text-slate-400">Last 60 days</span>
              </div>
              {/* Subtle grid background */}
              <div className="relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: '24px' }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="border-b border-dashed border-slate-100 w-full" />
                  ))}
                </div>
                <div className="flex items-end gap-2 h-48 relative z-10">
                  {data.weeklyTrend.map((week, i) => {
                    const maxBookings = Math.max(...data.weeklyTrend.map(w => w.bookings), 1);
                    const height = (week.bookings / maxBookings) * 100;
                    const isLast = i === data.weeklyTrend.length - 1;
                    return (
                      <div key={week.week} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg">
                          {week.bookings} bookings &middot; ${Math.round(week.revenue).toLocaleString()}
                        </div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(height, 4)}%` }}
                          transition={{ delay: i * 0.03, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className={`w-full rounded-lg transition-all duration-200 ${
                            isLast
                              ? 'bg-gradient-to-t from-green-600 to-green-500'
                              : 'bg-green-200/80 hover:bg-green-300/80'
                          } group-hover:opacity-90`}
                        />
                        <span className="text-[10px] text-slate-400 mt-1.5 font-medium">
                          {i % 2 === 0 ? new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Peak Hours Mini */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-slate-900">Peak Hours</h3>
                <span className="text-xs text-slate-400">Last 30 days average</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {data.peakHours.slice(0, 5).map((ph, i) => (
                  <motion.div
                    key={ph.hour}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + i * 0.05, duration: 0.3 }}
                    className="text-center p-4 rounded-xl bg-green-50/60 border border-green-100/80 hover:shadow-sm transition-shadow"
                  >
                    <p className="text-lg font-bold text-green-700">{formatHour(ph.hour)}</p>
                    <p className="text-xs text-slate-500 mt-1.5">{ph.utilization.toFixed(0)}% full</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{ph.avgBookings.toFixed(1)} avg</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Dead Spots Tab */}
        {activeTab === 'deadspots' && (
          <motion.div
            key="deadspots"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Revenue Opportunities</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Time slots with low utilization -- highest revenue potential first
                </p>
              </div>

              {/* Heatmap Grid */}
              <div className="p-6">
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-[80px_repeat(17,1fr)] gap-1.5 min-w-[700px]">
                    {/* Header row */}
                    <div />
                    {Array.from({ length: 17 }, (_, i) => (
                      <div key={i} className="text-[9px] text-slate-400 text-center font-medium pb-1">
                        {formatHour(i + 6)}
                      </div>
                    ))}

                    {/* Day rows */}
                    {DAYS.map(day => (
                      <>
                        <div key={day} className="text-xs text-slate-600 font-medium flex items-center">
                          {day.slice(0, 3)}
                        </div>
                        {Array.from({ length: 17 }, (_, h) => {
                          const spot = data.deadSpots.find(s => s.day === day && s.hour === h + 6);
                          const peak = data.peakHours.find(p => p.hour === h + 6);
                          const utilization = peak?.utilization || 0;

                          let bgColor = 'bg-green-500';
                          if (utilization < 20) bgColor = 'bg-rose-200';
                          else if (utilization < 40) bgColor = 'bg-amber-200';
                          else if (utilization < 60) bgColor = 'bg-emerald-200';
                          else if (utilization < 80) bgColor = 'bg-emerald-400';

                          return (
                            <div
                              key={`${day}-${h}`}
                              className={`h-8 rounded-md ${bgColor} opacity-75 hover:opacity-100 transition-all duration-200 cursor-pointer relative group hover:scale-105`}
                            >
                              {spot && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg">
                                  ${Math.round(spot.potentialRevenue).toLocaleString()}/week potential
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-5 mt-5 pt-5 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Utilization:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-4 rounded-md bg-rose-200" />
                    <span className="text-[11px] text-slate-500">&lt;20%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-4 rounded-md bg-amber-200" />
                    <span className="text-[11px] text-slate-500">20-40%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-4 rounded-md bg-emerald-200" />
                    <span className="text-[11px] text-slate-500">40-60%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-4 rounded-md bg-emerald-400" />
                    <span className="text-[11px] text-slate-500">60-80%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-4 rounded-md bg-green-500" />
                    <span className="text-[11px] text-slate-500">&gt;80%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Dead Spots List */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Top Unfilled Opportunities</h3>
              </div>
              <div className="divide-y divide-slate-100/80">
                {data.deadSpots.slice(0, 8).map((spot, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/80 transition-colors duration-200"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {spot.day}s at {formatHour(spot.hour)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Only {spot.avgBookings.toFixed(1)} avg bookings/week
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">
                        +${Math.round(spot.potentialRevenue).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">potential/week</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <motion.div
            key="players"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {/* At-Risk Players */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                    <UserMinus className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">At-Risk Members</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Players with declining activity -- re-engage before they churn
                    </p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-100/80">
                {data.atRiskPlayers.length > 0 ? data.atRiskPlayers.map((player, i) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/80 transition-colors duration-200"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 ring-2 ring-red-100">
                      <span className="text-sm font-semibold text-red-600">
                        {player.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{player.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Prefers {player.preferredDay}s at {formatHour(parseInt(player.preferredTime))}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-slate-400 font-medium">{player.bookingsLastMonth}</span>
                        <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center">
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        </div>
                        <span className="text-sm font-semibold text-red-600">{player.bookingsThisMonth}</span>
                      </div>
                      <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                        {player.trend === 'churning' ? 'Churning' : 'Declining'}
                      </span>
                    </div>
                  </motion.div>
                )) : (
                  <div className="px-6 py-14 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-slate-500">No at-risk players detected. Great retention!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Players */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Top Players</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Most active members this month -- your VIPs
                    </p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-100/80">
                {data.topPlayers.map((player, i) => {
                  const rankColors = [
                    { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
                    { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' },
                    { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-200' },
                  ];
                  const rankStyle = rankColors[i] || { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-100' };

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/80 transition-colors duration-200"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${rankStyle.bg} ring-2 ${rankStyle.ring}`}>
                        <span className={`text-xs font-bold ${rankStyle.text}`}>
                          {player.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">{player.name}</p>
                          {i < 3 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${rankStyle.bg} ${rankStyle.text}`}>
                              #{i + 1}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {player.preferredDay}s at {formatHour(parseInt(player.preferredTime))} &middot; ${Math.round(player.avgSpend).toLocaleString()} spent
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-700">{player.bookingsThisMonth}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">bookings</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'predictions' && (
          <motion.div
            key="predictions"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-green-700 via-green-700 to-emerald-600 rounded-2xl p-7 shadow-lg shadow-green-900/10"
            >
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
                  <p className="text-green-200 text-xs mt-0.5">Based on 60-day pattern analysis</p>
                </div>
              </div>
              <div className="space-y-3">
                {data.recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lightbulb className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-sm text-white/95 leading-relaxed">{rec}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300"
              >
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Dynamic Pricing Opportunity</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Revenue optimization</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {data.deadSpots.length > 0
                    ? `You have ${data.deadSpots.length} under-utilized time slots. Reducing rates by 20-30% during dead spots could generate an estimated $${Math.round(data.deadSpots.slice(0, 5).reduce((s, d) => s + d.potentialRevenue * 0.3, 0)).toLocaleString()}/week in new bookings.`
                    : 'Your courts are well-utilized! Consider premium pricing during peak hours.'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                    Estimated Impact: High
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300"
              >
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Engagement Campaign</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Member retention</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {data.atRiskPlayers.length > 0
                    ? `${data.atRiskPlayers.length} members are at risk of churning. A targeted "We miss you" email with a 15% discount on their preferred time slot has a 35% re-engagement rate industry-wide.`
                    : 'All active members are maintaining their booking frequency. Great job!'}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
                    data.atRiskPlayers.length > 0
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-sky-700 bg-sky-50'
                  }`}>
                    {data.atRiskPlayers.length > 0 ? 'Action Needed' : 'Monitoring'}
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Score Card Component - Zendenta V2 Style
function ScoreCard({ label, value, suffix, icon, color, description }: {
  label: string;
  value: number | string;
  suffix: string;
  icon: ReactNode;
  color: string;
  description: string;
}) {
  const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
    green: { bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-700' },
    teal: { bg: 'bg-teal-50', icon: 'text-teal-600', text: 'text-teal-700' },
    sky: { bg: 'bg-sky-50', icon: 'text-sky-600', text: 'text-sky-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-700' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-700' },
  };

  const colors = colorClasses[color] || colorClasses.green;

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-default"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-[44px] h-[44px] rounded-xl ${colors.bg} flex items-center justify-center`}>
          <span className={colors.icon}>{icon}</span>
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide leading-tight">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <p className={`text-[32px] font-bold leading-none ${colors.text}`}>{value}</p>
        <span className="text-sm text-slate-400 font-medium">{suffix}</span>
      </div>
      <div className="my-3 border-t border-slate-100" />
      <p className="text-xs text-slate-400">{description}</p>
    </motion.div>
  );
}
