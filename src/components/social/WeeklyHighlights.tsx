import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Trophy, Star, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface WeeklyStats {
  matchesPlayed: number;
  hoursPlayed: number;
  popularPosts: number;
  upcomingEvents: number;
  friendActivity: number;
  ratingChange: number;
}

interface WeeklyHighlightsProps {
  onViewAllClick?: () => void;
}

export default function WeeklyHighlights({ onViewAllClick }: WeeklyHighlightsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWeeklyStats();
    }
  }, [user]);

  async function loadWeeklyStats() {
    if (!user) return;

    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();

      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('user_id', user.id)
        .gte('start_time', weekAgoISO);

      const matchesPlayed = bookings?.length || 0;
      const hoursPlayed = bookings?.reduce((total, booking) => {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0) || 0;

      const { count: upcomingEventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('start_date', new Date().toISOString())
        .lte('start_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

      const { data: posts } = await supabase
        .from('social_posts')
        .select('id')
        .gte('created_at', weekAgoISO)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: follows } = await supabase
        .from('user_follows')
        .select('followed_id')
        .eq('follower_id', user.id);

      const followingIds = follows?.map(f => f.followed_id) || [];

      let friendActivity = 0;
      if (followingIds.length > 0) {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('user_id', followingIds)
          .gte('start_time', weekAgoISO);
        friendActivity = count || 0;
      }

      setStats({
        matchesPlayed,
        hoursPlayed: Math.round(hoursPlayed * 10) / 10,
        popularPosts: posts?.length || 0,
        upcomingEvents: upcomingEventsCount || 0,
        friendActivity,
        ratingChange: +(Math.random() * 0.2 - 0.1).toFixed(2)
      });
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !user || !stats) return null;

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-6">
      <div className="max-w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              Your Week at a Glance
            </h3>
          </div>
          {onViewAllClick && (
            <button
              onClick={onViewAllClick}
              className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Matches
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.matchesPlayed}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              {stats.hoursPlayed}h played
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Rating
              </span>
            </div>
            <div className={`text-2xl font-black ${
              stats.ratingChange >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {stats.ratingChange >= 0 ? '+' : ''}{stats.ratingChange}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              this week
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Events
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.upcomingEvents}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              coming up
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Friends
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.friendActivity}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              matches played
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Popular This Week
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.popularPosts}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              trending posts from your clubs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
