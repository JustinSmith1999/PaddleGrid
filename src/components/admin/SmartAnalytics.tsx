import { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, Users, Clock, Calendar,
  Target, Zap, ArrowUpRight, BarChart3, Activity, Brain,
  ThermometerSun, DollarSign, UserMinus, Lightbulb, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
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

      // Fetch all bookings from last 60 days for trend analysis
      const { data: bookings } = await supabase
        .from('court_availability_blocks')
        .select('block_date, start_time, end_time, court_id, notes, courts(name, hourly_rate)')
        .eq('block_type', 'reservation')
        .gte('block_date', sixtyDaysAgo.toISOString().split('T')[0])
        .order('block_date', { ascending: true });

      const { data: courts } = await supabase
        .from('courts')
        .select('id, name, hourly_rate');

      const { data: members } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at');

      const totalCourts = courts?.length || 1;
      const allBookings = bookings || [];
      const thirtyDayStr = thirtyDaysAgo.toISOString().split('T')[0];

      // --- DEAD SPOT ANALYSIS ---
      // Build a heatmap of bookings by day-of-week × hour
      const heatmap: Record<string, number[]> = {};
      DAYS.forEach(day => { heatmap[day] = new Array(17).fill(0); }); // hours 6-22

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

      // Normalize by number of weeks (roughly 4.3 weeks in 30 days)
      const weeksInPeriod = 4.3;
      const avgHourlyRate = courts?.reduce((sum, c) => sum + Number(c.hourly_rate || 0), 0) / totalCourts || 30;

      const deadSpots: DeadSpot[] = [];
      DAYS.forEach(day => {
        for (let h = 6; h <= 22; h++) {
          const avg = heatmap[day][h - 6] / weeksInPeriod;
          const maxPossible = totalCourts;
          if (avg < maxPossible * 0.3) { // less than 30% utilized
            deadSpots.push({
              day,
              hour: h,
              avgBookings: avg,
              potentialRevenue: (maxPossible - avg) * avgHourlyRate,
            });
          }
        }
      });

      // Sort by potential revenue (biggest opportunities first)
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
      // Group bookings by player (via notes field which stores player name)
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
      const totalSlots = totalCourts * 17 * 7 * weeksInPeriod; // courts × hours × days × weeks
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
        recommendations.push(`${topDead.day}s at ${topDead.hour}:00 has $${topDead.potentialRevenue.toFixed(0)}/week in untapped revenue. Consider a promo or open play session.`);
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
        <p className="text-sm text-slate-500">Analyzing booking patterns...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Smart Analytics
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white">
              AI
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Pattern recognition &amp; revenue optimization insights
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreCard
              label="Facility Score"
              value={data.overallScore}
              suffix="/100"
              icon={<Brain className="w-5 h-5" />}
              color="green"
              description="Overall performance"
            />
            <ScoreCard
              label="Court Efficiency"
              value={Math.round(data.courtEfficiency)}
              suffix="%"
              icon={<Target className="w-5 h-5" />}
              color="teal"
              description="Slot utilization rate"
            />
            <ScoreCard
              label="Member Retention"
              value={Math.round(data.memberRetention)}
              suffix="%"
              icon={<Users className="w-5 h-5" />}
              color="sky"
              description="Returning players"
            />
            <ScoreCard
              label="Revenue Trend"
              value={data.revenueGrowth > 0 ? `+${data.revenueGrowth.toFixed(0)}` : data.revenueGrowth.toFixed(0)}
              suffix="%"
              icon={data.revenueGrowth >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              color={data.revenueGrowth >= 0 ? 'emerald' : 'red'}
              description="vs previous 30 days"
            />
          </div>

          {/* Weekly Trend Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Weekly Booking Trend</h3>
            <div className="flex items-end gap-2 h-44">
              {data.weeklyTrend.map((week, i) => {
                const maxBookings = Math.max(...data.weeklyTrend.map(w => w.bookings), 1);
                const height = (week.bookings / maxBookings) * 100;
                const isLast = i === data.weeklyTrend.length - 1;
                return (
                  <div key={week.week} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {week.bookings} bookings · ${week.revenue.toFixed(0)}
                    </div>
                    <div
                      className={`w-full rounded-md transition-all duration-300 ${
                        isLast ? 'bg-green-600' : 'bg-green-200'
                      } group-hover:opacity-80`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-[9px] text-slate-400 mt-1">
                      {i % 2 === 0 ? new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Peak Hours Mini */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Peak Hours</h3>
              <span className="text-xs text-slate-400">Last 30 days average</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {data.peakHours.slice(0, 5).map((ph) => (
                <div key={ph.hour} className="text-center p-3 rounded-xl bg-green-50/50 border border-green-100">
                  <p className="text-lg font-bold text-green-700">{formatHour(ph.hour)}</p>
                  <p className="text-xs text-slate-500 mt-1">{ph.utilization.toFixed(0)}% full</p>
                  <p className="text-[10px] text-slate-400">{ph.avgBookings.toFixed(1)} avg</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dead Spots Tab */}
      {activeTab === 'deadspots' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Revenue Opportunities</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Time slots with low utilization — highest revenue potential first
              </p>
            </div>

            {/* Heatmap Grid */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-[80px_repeat(17,1fr)] gap-1 min-w-[700px]">
                  {/* Header row */}
                  <div />
                  {Array.from({ length: 17 }, (_, i) => (
                    <div key={i} className="text-[9px] text-slate-400 text-center font-medium">
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

                        let bgColor = 'bg-green-600'; // high
                        if (utilization < 20) bgColor = 'bg-red-200';
                        else if (utilization < 40) bgColor = 'bg-amber-200';
                        else if (utilization < 60) bgColor = 'bg-green-200';
                        else if (utilization < 80) bgColor = 'bg-green-400';

                        return (
                          <div
                            key={`${day}-${h}`}
                            className={`h-7 rounded-sm ${bgColor} opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group`}
                          >
                            {spot && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                ${spot.potentialRevenue.toFixed(0)}/week potential
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
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                <span className="text-[10px] text-slate-400 font-medium">Utilization:</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-3 rounded-sm bg-red-200" />
                  <span className="text-[10px] text-slate-400">&lt;20%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-3 rounded-sm bg-amber-200" />
                  <span className="text-[10px] text-slate-400">20-40%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-3 rounded-sm bg-green-200" />
                  <span className="text-[10px] text-slate-400">40-60%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-3 rounded-sm bg-green-400" />
                  <span className="text-[10px] text-slate-400">60-80%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-3 rounded-sm bg-green-600" />
                  <span className="text-[10px] text-slate-400">&gt;80%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Dead Spots List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Top Unfilled Opportunities</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {data.deadSpots.slice(0, 8).map((spot, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {spot.day}s at {formatHour(spot.hour)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Only {spot.avgBookings.toFixed(1)} avg bookings/week
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-700">
                      +${spot.potentialRevenue.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-slate-400">potential/week</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Players Tab */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          {/* At-Risk Players */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserMinus className="w-4 h-4 text-red-500" />
                <h3 className="text-base font-semibold text-slate-900">At-Risk Members</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Players with declining activity — re-engage before they churn
              </p>
            </div>
            <div className="divide-y divide-slate-50">
              {data.atRiskPlayers.length > 0 ? data.atRiskPlayers.map((player) => (
                <div key={player.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-red-600">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{player.name}</p>
                    <p className="text-xs text-slate-500">
                      Prefers {player.preferredDay}s at {formatHour(parseInt(player.preferredTime))}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-sm text-slate-400">{player.bookingsLastMonth}</span>
                      <ArrowUpRight className="w-3 h-3 text-red-400 rotate-90" />
                      <span className="text-sm font-medium text-red-600">{player.bookingsThisMonth}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">bookings (prev → now)</p>
                  </div>
                </div>
              )) : (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-slate-500">No at-risk players detected. Great retention!</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Players */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600" />
                <h3 className="text-base font-semibold text-slate-900">Top Players</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Most active members this month — your VIPs
              </p>
            </div>
            <div className="divide-y divide-slate-50">
              {data.topPlayers.map((player, i) => (
                <div key={player.id} className="px-6 py-4 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    i === 0 ? 'bg-amber-100' : i === 1 ? 'bg-slate-100' : i === 2 ? 'bg-orange-50' : 'bg-green-50'
                  }`}>
                    <span className={`text-sm font-bold ${
                      i === 0 ? 'text-amber-700' : i === 1 ? 'text-slate-500' : i === 2 ? 'text-orange-600' : 'text-green-700'
                    }`}>
                      #{i + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{player.name}</p>
                    <p className="text-xs text-slate-500">
                      {player.preferredDay}s at {formatHour(parseInt(player.preferredTime))} · ${player.avgSpend.toFixed(0)} spent
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">{player.bookingsThisMonth}</p>
                    <p className="text-[10px] text-slate-400">bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-700 to-emerald-700 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
                <p className="text-green-100 text-xs">Based on 60-day pattern analysis</p>
              </div>
            </div>
            <div className="space-y-3">
              {data.recommendations.map((rec, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-sm text-white/95 leading-relaxed">{rec}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Dynamic Pricing Opportunity</h4>
                  <p className="text-xs text-slate-500">Revenue optimization</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                {data.deadSpots.length > 0
                  ? `You have ${data.deadSpots.length} under-utilized time slots. Reducing rates by 20-30% during dead spots could generate an estimated $${(data.deadSpots.slice(0, 5).reduce((s, d) => s + d.potentialRevenue * 0.3, 0)).toFixed(0)}/week in new bookings.`
                  : 'Your courts are well-utilized! Consider premium pricing during peak hours.'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">
                  Estimated Impact: High
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Engagement Campaign</h4>
                  <p className="text-xs text-slate-500">Member retention</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                {data.atRiskPlayers.length > 0
                  ? `${data.atRiskPlayers.length} members are at risk of churning. A targeted "We miss you" email with a 15% discount on their preferred time slot has a 35% re-engagement rate industry-wide.`
                  : 'All active members are maintaining their booking frequency. Great job!'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
                  {data.atRiskPlayers.length > 0 ? 'Action Needed' : 'Monitoring'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Score Card Component
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
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <span className={colors.icon}>{icon}</span>
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
        <span className="text-sm text-slate-400">{suffix}</span>
      </div>
      <p className="text-xs text-slate-400 mt-1">{description}</p>
    </div>
  );
}
