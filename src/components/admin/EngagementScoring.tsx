import { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Minus, Activity, Calendar, Target, Zap, Crown, AlertTriangle, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface MemberEngagement {
  id: string;
  name: string;
  avatar_url: string | null;
  email: string;
  score: number; // 0-100
  trend: 'rising' | 'stable' | 'declining';
  lastActive: string;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
  eventsAttended: number;
  memberSince: string;
  tier: 'vip' | 'engaged' | 'casual' | 'at-risk' | 'churning';
}

interface EngagementScoringProps {
  facilityId: string | null;
}

const TIER_CONFIG = {
  vip: { label: 'VIP', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Crown className="w-3.5 h-3.5" />, min: 80 },
  engaged: { label: 'Engaged', color: 'bg-green-50 text-green-700 border-green-200', icon: <TrendingUp className="w-3.5 h-3.5" />, min: 60 },
  casual: { label: 'Casual', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: <Minus className="w-3.5 h-3.5" />, min: 35 },
  'at-risk': { label: 'At Risk', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <AlertTriangle className="w-3.5 h-3.5" />, min: 15 },
  churning: { label: 'Churning', color: 'bg-red-50 text-red-700 border-red-200', icon: <TrendingDown className="w-3.5 h-3.5" />, min: 0 },
};

export default function EngagementScoring({ facilityId }: EngagementScoringProps) {
  const [members, setMembers] = useState<MemberEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'trend' | 'recent'>('score');

  useEffect(() => {
    loadEngagementData();
  }, []);

  const loadEngagementData = async () => {
    try {
      // Load members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email, created_at')
        .order('full_name');

      if (!profiles) { setLoading(false); return; }

      // Load bookings for scoring
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: bookings } = await supabase
        .from('court_availability_blocks')
        .select('block_date, booked_by')
        .eq('block_type', 'reservation')
        .gte('block_date', sixtyDaysAgo.toISOString().split('T')[0]);

      // Load event attendance
      const { data: signups } = await supabase
        .from('series_signups')
        .select('user_id, signed_up_at');

      // Build engagement map
      const bookingsByUser: Record<string, { thisMonth: number; lastMonth: number; lastDate: string }> = {};
      bookings?.forEach(b => {
        const userId = b.booked_by;
        if (!userId) return;
        if (!bookingsByUser[userId]) bookingsByUser[userId] = { thisMonth: 0, lastMonth: 0, lastDate: '' };

        const bookDate = new Date(b.block_date);
        if (bookDate >= thisMonthStart) bookingsByUser[userId].thisMonth++;
        else if (bookDate >= lastMonthStart) bookingsByUser[userId].lastMonth++;

        if (b.block_date > bookingsByUser[userId].lastDate) {
          bookingsByUser[userId].lastDate = b.block_date;
        }
      });

      const eventsByUser: Record<string, number> = {};
      signups?.forEach(s => {
        eventsByUser[s.user_id] = (eventsByUser[s.user_id] || 0) + 1;
      });

      // Calculate scores
      const scored: MemberEngagement[] = profiles.map(p => {
        const userBookings = bookingsByUser[p.id] || { thisMonth: 0, lastMonth: 0, lastDate: '' };
        const events = eventsByUser[p.id] || 0;

        // Score components (each 0-25 max, total 0-100)
        const frequencyScore = Math.min(25, userBookings.thisMonth * 5); // 5 per booking, max 25
        const consistencyScore = Math.min(25, userBookings.lastMonth > 0 ? 15 + Math.min(10, userBookings.lastMonth * 3) : 0);
        const eventScore = Math.min(25, events * 8); // 8 per event, max 25

        // Recency score
        let recencyScore = 0;
        if (userBookings.lastDate) {
          const daysSince = Math.floor((now.getTime() - new Date(userBookings.lastDate).getTime()) / (1000 * 60 * 60 * 24));
          recencyScore = Math.max(0, 25 - daysSince); // Loses 1 point per day inactive
        }

        const totalScore = Math.min(100, frequencyScore + consistencyScore + eventScore + recencyScore);

        // Determine trend
        let trend: 'rising' | 'stable' | 'declining' = 'stable';
        if (userBookings.thisMonth > userBookings.lastMonth + 1) trend = 'rising';
        else if (userBookings.thisMonth < userBookings.lastMonth - 1) trend = 'declining';

        // Determine tier
        let tier: MemberEngagement['tier'] = 'churning';
        if (totalScore >= 80) tier = 'vip';
        else if (totalScore >= 60) tier = 'engaged';
        else if (totalScore >= 35) tier = 'casual';
        else if (totalScore >= 15) tier = 'at-risk';

        return {
          id: p.id,
          name: p.full_name || p.email || 'Unknown',
          avatar_url: p.avatar_url,
          email: p.email || '',
          score: totalScore,
          trend,
          lastActive: userBookings.lastDate || p.created_at,
          bookingsThisMonth: userBookings.thisMonth,
          bookingsLastMonth: userBookings.lastMonth,
          eventsAttended: events,
          memberSince: p.created_at,
          tier,
        };
      });

      scored.sort((a, b) => b.score - a.score);
      setMembers(scored);
    } catch (error) {
      console.error('Error loading engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => filterTier === 'all' || m.tier === filterTier);

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'trend') {
      const order = { rising: 0, stable: 1, declining: 2 };
      return order[a.trend] - order[b.trend];
    }
    return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
  });

  // Distribution counts
  const distribution = {
    vip: members.filter(m => m.tier === 'vip').length,
    engaged: members.filter(m => m.tier === 'engaged').length,
    casual: members.filter(m => m.tier === 'casual').length,
    'at-risk': members.filter(m => m.tier === 'at-risk').length,
    churning: members.filter(m => m.tier === 'churning').length,
  };

  const avgScore = members.length > 0 ? Math.round(members.reduce((s, m) => s + m.score, 0) / members.length) : 0;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
        <p className="text-sm text-slate-500" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Calculating engagement scores...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Engagement Scoring
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white tracking-wide">
            AI
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Member health scores based on booking frequency, recency, and participation
        </p>
      </div>

      {/* Score Overview */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {/* Average Score Gauge */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Community Health
            </h3>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="3"
                />
                <motion.path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#15803d"
                  strokeWidth="3"
                  strokeDasharray={`${avgScore}, 100`}
                  initial={{ strokeDasharray: '0, 100' }}
                  animate={{ strokeDasharray: `${avgScore}, 100` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-900">{avgScore}</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Active members</span>
                <span className="font-semibold text-slate-900">{distribution.vip + distribution.engaged}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">At risk</span>
                <span className="font-semibold text-orange-600">{distribution['at-risk']}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Churning</span>
                <span className="font-semibold text-red-600">{distribution.churning}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Distribution */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 p-6"
        >
          <h3 className="text-sm font-semibold text-slate-900 mb-5" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Tier Distribution
          </h3>
          <div className="space-y-3.5">
            {Object.entries(TIER_CONFIG).map(([key, config]) => {
              const count = distribution[key as keyof typeof distribution];
              const pct = members.length > 0 ? (count / members.length) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${config.color} min-w-[85px]`}>
                    {config.icon}
                    {config.label}
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 min-w-[28px] text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {[
            { id: 'all', label: 'All' },
            { id: 'vip', label: 'VIP' },
            { id: 'engaged', label: 'Engaged' },
            { id: 'casual', label: 'Casual' },
            { id: 'at-risk', label: 'At Risk' },
            { id: 'churning', label: 'Churning' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTier(tab.id)}
              className={`px-4 py-2.5 text-xs font-medium transition-all duration-150 ${
                filterTier === tab.id
                  ? 'bg-green-50 text-green-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="text-xs border border-slate-200/60 rounded-xl px-4 py-2.5 text-slate-600 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all duration-150"
        >
          <option value="score">Sort by Score</option>
          <option value="trend">Sort by Trend</option>
          <option value="recent">Sort by Last Active</option>
        </select>
      </div>

      {/* Member List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-[1fr_80px_80px_80px_80px_60px] gap-4 items-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Member</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">Score</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">This Mo.</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">Events</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">Tier</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">Trend</span>
        </div>

        <div className="divide-y divide-slate-100/80 max-h-[500px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {sortedMembers.slice(0, 50).map((member, index) => {
              const tierConfig = TIER_CONFIG[member.tier];

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  layout
                  className="px-6 py-3.5 grid grid-cols-[1fr_80px_80px_80px_80px_60px] gap-4 items-center hover:bg-slate-50/60 transition-colors duration-150"
                >
                  {/* Member */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-white shadow-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex justify-center">
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#f1f5f9"
                          strokeWidth="4"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={member.score >= 60 ? '#15803d' : member.score >= 35 ? '#d97706' : '#dc2626'}
                          strokeWidth="4"
                          strokeDasharray={`${member.score}, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-700">{member.score}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bookings This Month */}
                  <div className="text-center">
                    <span className="text-sm font-medium text-slate-900">{member.bookingsThisMonth}</span>
                    {member.bookingsLastMonth > 0 && (
                      <span className={`text-[9px] ml-1 font-medium ${
                        member.bookingsThisMonth > member.bookingsLastMonth ? 'text-green-600' :
                        member.bookingsThisMonth < member.bookingsLastMonth ? 'text-red-500' : 'text-slate-400'
                      }`}>
                        {member.bookingsThisMonth > member.bookingsLastMonth ? '↑' : member.bookingsThisMonth < member.bookingsLastMonth ? '↓' : '–'}
                      </span>
                    )}
                  </div>

                  {/* Events */}
                  <div className="text-center">
                    <span className="text-sm font-medium text-slate-900">{member.eventsAttended}</span>
                  </div>

                  {/* Tier */}
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold border ${tierConfig.color}`}>
                      {tierConfig.icon}
                      {tierConfig.label}
                    </span>
                  </div>

                  {/* Trend */}
                  <div className="flex justify-center">
                    {member.trend === 'rising' && (
                      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    {member.trend === 'stable' && (
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                        <Minus className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    {member.trend === 'declining' && (
                      <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {sortedMembers.length === 0 && (
          <div className="text-center py-14">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No members match this filter</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
