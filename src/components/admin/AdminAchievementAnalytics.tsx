import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Award, Target, BarChart3, PieChart } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AchievementStats {
  total_achievements: number;
  total_unlocked: number;
  total_points_awarded: number;
  unique_users_with_achievements: number;
  avg_achievements_per_user: number;
  most_popular_achievement: {
    name: string;
    unlock_count: number;
  } | null;
  rarest_achievement: {
    name: string;
    unlock_count: number;
  } | null;
  category_breakdown: {
    category: string;
    count: number;
    unlock_rate: number;
  }[];
  rarity_breakdown: {
    rarity: string;
    count: number;
    total_points: number;
  }[];
  recent_unlocks: {
    user_name: string;
    achievement_name: string;
    unlocked_at: string;
    points: number;
  }[];
}

export default function AdminAchievementAnalytics() {
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | '7d' | '30d'>('all');

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true);

      let userAchievementsQuery = supabase
        .from('user_achievements')
        .select(`
          *,
          achievements!inner(name, points, category, rarity),
          profiles!inner(full_name)
        `)
        .not('unlocked_at', 'is', null);

      if (timeframe === '7d') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        userAchievementsQuery = userAchievementsQuery.gte('unlocked_at', weekAgo.toISOString());
      } else if (timeframe === '30d') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        userAchievementsQuery = userAchievementsQuery.gte('unlocked_at', monthAgo.toISOString());
      }

      const { data: userAchievements } = await userAchievementsQuery;

      const totalPoints = userAchievements?.reduce((sum, ua) => sum + (ua.achievements.points || 0), 0) || 0;
      const uniqueUsers = new Set(userAchievements?.map(ua => ua.user_id)).size;

      const achievementCounts = new Map<string, { name: string; count: number }>();
      userAchievements?.forEach(ua => {
        const key = ua.achievement_id;
        if (!achievementCounts.has(key)) {
          achievementCounts.set(key, { name: ua.achievements.name, count: 0 });
        }
        achievementCounts.get(key)!.count++;
      });

      const sortedAchievements = Array.from(achievementCounts.values()).sort((a, b) => b.count - a.count);
      const mostPopular = sortedAchievements[0] || null;
      const rarest = sortedAchievements[sortedAchievements.length - 1] || null;

      const categoryMap = new Map<string, { count: number; total: number }>();
      achievements?.forEach(ach => {
        if (!categoryMap.has(ach.category)) {
          categoryMap.set(ach.category, { count: 0, total: 0 });
        }
        categoryMap.get(ach.category)!.total++;
      });

      userAchievements?.forEach(ua => {
        const cat = ua.achievements.category;
        if (categoryMap.has(cat)) {
          categoryMap.get(cat)!.count++;
        }
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        unlock_rate: data.total > 0 ? (data.count / data.total) * 100 : 0
      }));

      const rarityMap = new Map<string, { count: number; points: number }>();
      userAchievements?.forEach(ua => {
        const rarity = ua.achievements.rarity;
        if (!rarityMap.has(rarity)) {
          rarityMap.set(rarity, { count: 0, points: 0 });
        }
        const rarityData = rarityMap.get(rarity)!;
        rarityData.count++;
        rarityData.points += ua.achievements.points || 0;
      });

      const rarityBreakdown = Array.from(rarityMap.entries()).map(([rarity, data]) => ({
        rarity,
        count: data.count,
        total_points: data.points
      }));

      const recentUnlocks = userAchievements
        ?.sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
        .slice(0, 10)
        .map(ua => ({
          user_name: ua.profiles.full_name,
          achievement_name: ua.achievements.name,
          unlocked_at: ua.unlocked_at,
          points: ua.achievements.points
        })) || [];

      setStats({
        total_achievements: achievements?.length || 0,
        total_unlocked: userAchievements?.length || 0,
        total_points_awarded: totalPoints,
        unique_users_with_achievements: uniqueUsers,
        avg_achievements_per_user: uniqueUsers > 0 ? (userAchievements?.length || 0) / uniqueUsers : 0,
        most_popular_achievement: mostPopular,
        rarest_achievement: rarest,
        category_breakdown: categoryBreakdown,
        rarity_breakdown: rarityBreakdown,
        recent_unlocks: recentUnlocks
      });
    } catch (error) {
      console.error('Error fetching achievement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-400 to-pink-500';
      case 'rare': return 'bg-gradient-to-r from-blue-400 to-cyan-500';
      case 'uncommon': return 'bg-gradient-to-r from-green-400 to-emerald-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 animate-pulse mx-auto mb-2" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Achievement Analytics</h2>
          <p className="text-sm text-gray-600">Track engagement and achievement completion rates</p>
        </div>
        <div className="flex gap-2">
          {['all', '7d', '30d'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                timeframe === tf
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf === 'all' ? 'All Time' : tf === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">TOTAL</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total_unlocked.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Achievements Unlocked</div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.total_achievements} available
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">PLAYERS</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.unique_users_with_achievements}</div>
          <div className="text-sm text-gray-600">Active Players</div>
          <div className="mt-2 text-xs text-gray-500">
            Avg: {stats.avg_achievements_per_user.toFixed(1)} per player
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">POINTS</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total_points_awarded.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Points Awarded</div>
          <div className="mt-2 text-xs text-gray-500">
            Across all achievements
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-green-600" />
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">RATE</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {((stats.total_unlocked / (stats.total_achievements * stats.unique_users_with_achievements || 1)) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
          <div className="mt-2 text-xs text-gray-500">
            Overall progress
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900">Category Breakdown</h3>
          </div>
          <div className="space-y-3">
            {stats.category_breakdown.map(cat => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">{cat.category}</span>
                  <span className="text-sm font-bold text-gray-900">{cat.count} unlocked</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                    style={{ width: `${cat.unlock_rate}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{cat.unlock_rate.toFixed(1)}% unlock rate</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900">Rarity Distribution</h3>
          </div>
          <div className="space-y-3">
            {stats.rarity_breakdown.map(rarity => (
              <div key={rarity.rarity} className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg ${getRarityColor(rarity.rarity)} flex items-center justify-center flex-shrink-0`}>
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 capitalize">{rarity.rarity}</span>
                    <span className="text-sm font-bold text-gray-900">{rarity.count}</span>
                  </div>
                  <div className="text-xs text-gray-600">{rarity.total_points.toLocaleString()} points total</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-bold text-gray-900">Most Popular Achievement</h3>
              {stats.most_popular_achievement && (
                <p className="text-sm text-gray-600">
                  {stats.most_popular_achievement.name} - {stats.most_popular_achievement.unlock_count} unlocks
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-bold text-gray-900">Rarest Achievement</h3>
              {stats.rarest_achievement && (
                <p className="text-sm text-gray-600">
                  {stats.rarest_achievement.name} - {stats.rarest_achievement.unlock_count} unlocks
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Recent Achievement Unlocks</h3>
        <div className="space-y-2">
          {stats.recent_unlocks.map((unlock, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{unlock.user_name}</span>
                <span className="text-gray-500 mx-2">unlocked</span>
                <span className="font-semibold text-emerald-600">{unlock.achievement_name}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-yellow-600">+{unlock.points}</div>
                <div className="text-xs text-gray-500">
                  {new Date(unlock.unlocked_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
