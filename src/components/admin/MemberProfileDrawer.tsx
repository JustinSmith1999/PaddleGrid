import { useState, useEffect } from 'react';
import { X, Mail, Phone, Calendar, MapPin, TrendingUp, TrendingDown, Minus, Activity, Trophy, Clock, Star, CreditCard, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface MemberProfileDrawerProps {
  memberId: string | null;
  onClose: () => void;
}

interface MemberProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url: string | null;
  created_at: string;
  skill_level?: number;
  dupr_rating?: number;
  totalBookings: number;
  thisMonthBookings: number;
  eventsAttended: number;
  totalSpent: number;
  favoriteTime?: string;
  favoriteCourt?: string;
  streak: number;
  engagementScore: number;
}

export default function MemberProfileDrawer({ memberId, onClose }: MemberProfileDrawerProps) {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberId) {
      loadProfile(memberId);
    }
  }, [memberId]);

  const loadProfile = async (id: string) => {
    setLoading(true);
    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (!user) { setLoading(false); return; }

      // Get booking stats
      const { data: bookings } = await supabase
        .from('court_availability_blocks')
        .select('block_date, start_time, court_id, courts(name)')
        .eq('booked_by', id)
        .eq('block_type', 'reservation')
        .order('block_date', { ascending: false });

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisMonth = bookings?.filter(b => new Date(b.block_date) >= thisMonthStart).length || 0;

      // Find favorite time
      const hourCounts: Record<number, number> = {};
      bookings?.forEach(b => {
        const h = parseInt(b.start_time?.split(':')[0] || '0');
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      });
      const favoriteHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
      const formatHour = (h: number) => `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;

      // Find favorite court
      const courtCounts: Record<string, number> = {};
      bookings?.forEach(b => {
        const name = (b.courts as any)?.name || 'Unknown';
        courtCounts[name] = (courtCounts[name] || 0) + 1;
      });
      const favoriteCourt = Object.entries(courtCounts).sort(([, a], [, b]) => b - a)[0];

      // Events attended
      const { count: eventCount } = await supabase
        .from('series_signups')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);

      // Calculate streak (consecutive weeks with bookings)
      let streak = 0;
      if (bookings && bookings.length > 0) {
        const weekSet = new Set<string>();
        bookings.forEach(b => {
          const d = new Date(b.block_date);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          weekSet.add(weekStart.toISOString().split('T')[0]);
        });
        const sortedWeeks = [...weekSet].sort().reverse();
        for (let i = 0; i < sortedWeeks.length - 1; i++) {
          const diff = (new Date(sortedWeeks[i]).getTime() - new Date(sortedWeeks[i + 1]).getTime()) / (1000 * 60 * 60 * 24);
          if (diff <= 8) streak++;
          else break;
        }
      }

      // Get DUPR
      const { data: playerStats } = await supabase
        .from('player_stats')
        .select('dupr_rating, skill_level')
        .eq('user_id', id)
        .maybeSingle();

      // Simple engagement score
      const recency = bookings?.[0]?.block_date
        ? Math.max(0, 25 - Math.floor((now.getTime() - new Date(bookings[0].block_date).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      const freqScore = Math.min(25, thisMonth * 5);
      const eventScore = Math.min(25, (eventCount || 0) * 8);
      const streakScore = Math.min(25, streak * 5);
      const engagementScore = Math.min(100, recency + freqScore + eventScore + streakScore);

      setProfile({
        id: user.id,
        name: user.full_name || user.email || 'Unknown',
        email: user.email || '',
        phone: user.phone,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        skill_level: playerStats?.skill_level,
        dupr_rating: playerStats?.dupr_rating,
        totalBookings: bookings?.length || 0,
        thisMonthBookings: thisMonth,
        eventsAttended: eventCount || 0,
        totalSpent: (bookings?.length || 0) * 30, // estimate
        favoriteTime: favoriteHour ? formatHour(parseInt(favoriteHour[0])) : undefined,
        favoriteCourt: favoriteCourt?.[0],
        streak,
        engagementScore,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {memberId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {loading || !profile ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="relative bg-gradient-to-br from-green-600 to-emerald-700 px-6 pt-6 pb-16">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                      <p className="text-green-100 text-sm">{profile.email}</p>
                      {profile.dupr_rating && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/20 text-white text-xs font-medium">
                          <Star className="w-3 h-3" />
                          DUPR {profile.dupr_rating.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Engagement Score Card */}
                <div className="px-6 -mt-10">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-900">Engagement Score</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        profile.engagementScore >= 60 ? 'bg-green-50 text-green-700' :
                        profile.engagementScore >= 35 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {profile.engagementScore >= 60 ? 'Healthy' : profile.engagementScore >= 35 ? 'Moderate' : 'Low'}
                      </span>
                    </div>

                    {/* Score Bar */}
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${profile.engagementScore}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-400">0</span>
                      <span className="text-xs font-bold text-slate-700">{profile.engagementScore}/100</span>
                      <span className="text-[10px] text-slate-400">100</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="px-6 mt-5 grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-[10px] text-slate-400 font-medium">This Month</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{profile.thisMonthBookings} bookings</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-3.5 h-3.5 text-violet-600" />
                      <span className="text-[10px] text-slate-400 font-medium">Total Bookings</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{profile.totalBookings}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[10px] text-slate-400 font-medium">Events</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{profile.eventsAttended}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3.5 h-3.5 text-orange-600" />
                      <span className="text-[10px] text-slate-400 font-medium">Streak</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{profile.streak} weeks</p>
                  </div>
                </div>

                {/* Preferences / Patterns */}
                <div className="px-6 mt-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Patterns & Preferences</h3>
                  <div className="space-y-2.5">
                    {profile.favoriteTime && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs font-medium text-slate-700">Preferred Time</p>
                          <p className="text-[11px] text-slate-400">{profile.favoriteTime}</p>
                        </div>
                      </div>
                    )}
                    {profile.favoriteCourt && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs font-medium text-slate-700">Favorite Court</p>
                          <p className="text-[11px] text-slate-400">{profile.favoriteCourt}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs font-medium text-slate-700">Estimated LTV</p>
                        <p className="text-[11px] text-slate-400">${profile.totalSpent} total</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs font-medium text-slate-700">Member Since</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 mt-6 pb-8 space-y-2">
                  <button className="w-full py-2.5 text-sm font-medium text-green-700 border border-green-200 rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    Send Message
                  </button>
                  <button className="w-full py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    View Booking History
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
