import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Flame, TrendingUp, Users, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  profile_picture_url: string | null;
  total_achievements: number;
  total_points: number;
  legendary_count: number;
  epic_count: number;
  rare_count: number;
  recent_achievement?: {
    name: string;
    unlocked_at: string;
  };
}

interface AchievementLeaderboardProps {
  facilityId?: string;
  limit?: number;
  timeframe?: 'all-time' | 'monthly' | 'weekly';
}

export default function AchievementLeaderboard({
  facilityId,
  limit = 10,
  timeframe = 'all-time'
}: AchievementLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'points' | 'achievements' | 'recent'>('points');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, [facilityId, timeframe, activeTab]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('user_achievements')
        .select(`
          user_id,
          unlocked_at,
          achievements!inner(
            name,
            points,
            rarity
          ),
          profiles!inner(
            full_name,
            profile_picture_url
          )
        `)
        .not('unlocked_at', 'is', null);

      if (timeframe === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('unlocked_at', weekAgo.toISOString());
      } else if (timeframe === 'monthly') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('unlocked_at', monthAgo.toISOString());
      }

      if (facilityId) {
        query = query.in('user_id',
          supabase
            .from('facility_users')
            .select('user_id')
            .eq('facility_id', facilityId)
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      const userMap = new Map<string, LeaderboardEntry>();

      data?.forEach((item: any) => {
        if (!userMap.has(item.user_id)) {
          userMap.set(item.user_id, {
            user_id: item.user_id,
            full_name: item.profiles.full_name,
            profile_picture_url: item.profiles.profile_picture_url,
            total_achievements: 0,
            total_points: 0,
            legendary_count: 0,
            epic_count: 0,
            rare_count: 0
          });
        }

        const entry = userMap.get(item.user_id)!;
        entry.total_achievements++;
        entry.total_points += item.achievements.points;

        if (item.achievements.rarity === 'legendary') entry.legendary_count++;
        if (item.achievements.rarity === 'epic') entry.epic_count++;
        if (item.achievements.rarity === 'rare') entry.rare_count++;

        if (!entry.recent_achievement || new Date(item.unlocked_at) > new Date(entry.recent_achievement.unlocked_at)) {
          entry.recent_achievement = {
            name: item.achievements.name,
            unlocked_at: item.unlocked_at
          };
        }
      });

      let sortedEntries = Array.from(userMap.values());

      if (activeTab === 'points') {
        sortedEntries.sort((a, b) => b.total_points - a.total_points);
      } else if (activeTab === 'achievements') {
        sortedEntries.sort((a, b) => b.total_achievements - a.total_achievements);
      } else if (activeTab === 'recent') {
        sortedEntries.sort((a, b) => {
          if (!a.recent_achievement) return 1;
          if (!b.recent_achievement) return -1;
          return new Date(b.recent_achievement.unlocked_at).getTime() -
                 new Date(a.recent_achievement.unlocked_at).getTime();
        });
      }

      setEntries(sortedEntries.slice(0, limit));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="font-bold text-gray-500">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-400';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-600';
    return 'bg-white border border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Achievement Leaders</h2>
            <p className="text-sm text-gray-600">
              {timeframe === 'weekly' ? 'This Week' : timeframe === 'monthly' ? 'This Month' : 'All Time'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('points')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'points'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Star className="w-4 h-4" />
          Points
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'achievements'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Count
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'recent'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          Recent
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 animate-pulse mx-auto mb-2" />
          <p className="text-gray-500">Loading leaderboard...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">No achievements yet</p>
          <p className="text-sm text-gray-500 mt-1">Be the first to unlock achievements!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => {
            const rank = index + 1;
            return (
              <div
                key={entry.user_id}
                onClick={() => navigate(`/player/${entry.user_id}`)}
                className={`${getRankBg(rank)} rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer group`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  {entry.profile_picture_url ? (
                    <img
                      src={entry.profile_picture_url}
                      alt={entry.full_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                      {entry.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                      {entry.full_name}
                    </h3>
                    {activeTab === 'recent' && entry.recent_achievement && (
                      <p className="text-sm text-gray-600 truncate">
                        Latest: {entry.recent_achievement.name}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-gray-900">
                      {activeTab === 'points' ? entry.total_points.toLocaleString() : entry.total_achievements}
                    </div>
                    <div className="text-xs text-gray-600">
                      {activeTab === 'points' ? 'points' : activeTab === 'achievements' ? 'achievements' : 'unlocked'}
                    </div>

                    {(entry.legendary_count > 0 || entry.epic_count > 0) && (
                      <div className="flex items-center justify-end gap-1 mt-1">
                        {entry.legendary_count > 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                            {entry.legendary_count} ⭐
                          </span>
                        )}
                        {entry.epic_count > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            {entry.epic_count} 💎
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {rank === 1 && (
                  <div className="mt-3 pt-3 border-t border-yellow-200">
                    <div className="flex items-center justify-center gap-2 text-yellow-700">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-semibold">Current Champion</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
