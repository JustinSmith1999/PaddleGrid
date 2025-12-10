import { useState, useEffect } from 'react';
import { Trophy, Award, Star, Lock, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  achievements: Achievement;
}

export default function AchievementsBadges() {
  const { user } = useAuth();
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  async function loadAchievements() {
    try {
      const [achievementsRes, userAchievementsRes] = await Promise.all([
        supabase.from('achievements').select('*').eq('is_active', true),
        supabase
          .from('user_achievements')
          .select('*, achievements(*)')
          .eq('user_id', user!.id)
      ]);

      if (achievementsRes.error) throw achievementsRes.error;
      if (userAchievementsRes.error) throw userAchievementsRes.error;

      setAllAchievements(achievementsRes.data || []);
      setUserAchievements(userAchievementsRes.data || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  }

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

  const filteredAchievements = allAchievements.filter(achievement => {
    const isUnlocked = unlockedIds.has(achievement.id);

    if (filter === 'unlocked' && !isUnlocked) return false;
    if (filter === 'locked' && isUnlocked) return false;
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;

    return true;
  });

  const hiddenCategories = ['all', 'matches', 'hours', 'social', 'competitive', 'milestones'];
  const categories = ['all', ...Array.from(new Set(allAchievements.map(a => a.category)))].filter(
    cat => !hiddenCategories.includes(cat)
  );

  const totalPoints = userAchievements.reduce((sum, ua) => sum + ua.achievements.points, 0);
  const unlockedCount = userAchievements.filter(ua => ua.progress === 100).length;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      case 'epic':
        return 'from-purple-400 to-pink-500';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-400';
      case 'epic':
        return 'border-purple-400';
      case 'rare':
        return 'border-blue-400';
      default:
        return 'border-gray-300';
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600 font-medium mb-2">Sign in to track achievements</p>
        <p className="text-sm text-gray-500">Unlock badges and earn rewards as you play</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Achievements</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track your progress and unlock rewards</p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{unlockedCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Unlocked</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">{totalPoints}</div>
            <div className="text-xs text-gray-500 mt-0.5">Points</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {allAchievements.length > 0
                ? Math.round((unlockedCount / allAchievements.length) * 100)
                : 0}%
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Complete</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-emerald-500 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unlocked')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            filter === 'unlocked'
              ? 'bg-emerald-500 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          Unlocked
        </button>
        <button
          onClick={() => setFilter('locked')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            filter === 'locked'
              ? 'bg-emerald-500 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          Locked
        </button>

        {categories.length > 1 && <div className="w-px h-6 sm:h-8 bg-gray-200 mx-1"></div>}

        {categories.map(category => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium capitalize transition-colors ${
              categoryFilter === category
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 h-40 sm:h-44 rounded-lg"></div>
          ))}
        </div>
      ) : filteredAchievements.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredAchievements.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            const userAchievement = userAchievements.find(
              ua => ua.achievement_id === achievement.id
            );

            return (
              <div
                key={achievement.id}
                className={`relative rounded-lg border bg-white p-3 sm:p-5 transition-all ${
                  isUnlocked
                    ? `${getRarityBorder(achievement.rarity)} hover:shadow-md`
                    : 'border-gray-200 opacity-60'
                }`}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg backdrop-blur-[2px]">
                    <Lock className="w-7 sm:w-8 h-7 sm:h-8 text-gray-400" />
                  </div>
                )}

                <div className="text-center">
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 rounded-full bg-gradient-to-br ${getRarityColor(
                      achievement.rarity
                    )} flex items-center justify-center text-white`}
                  >
                    {achievement.icon === 'trophy' ? (
                      <Trophy className="w-6 sm:w-8 h-6 sm:h-8" />
                    ) : achievement.icon === 'star' ? (
                      <Star className="w-6 sm:w-8 h-6 sm:h-8" />
                    ) : (
                      <Award className="w-6 sm:w-8 h-6 sm:h-8" />
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 line-clamp-1">{achievement.name}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3 line-clamp-2">{achievement.description}</p>

                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                        achievement.rarity === 'legendary'
                          ? 'bg-yellow-100 text-yellow-700'
                          : achievement.rarity === 'epic'
                          ? 'bg-purple-100 text-purple-700'
                          : achievement.rarity === 'rare'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {achievement.rarity}
                    </span>
                    <span className="text-emerald-600 font-semibold text-[10px] sm:text-xs">
                      {achievement.points}
                    </span>
                  </div>

                  {userAchievement && userAchievement.progress < 100 && (
                    <div className="mt-2 sm:mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5">
                        <div
                          className="bg-emerald-500 h-1 sm:h-1.5 rounded-full transition-all"
                          style={{ width: `${userAchievement.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{userAchievement.progress}%</p>
                    </div>
                  )}

                  {isUnlocked && userAchievement && (
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">
                      {new Date(userAchievement.unlocked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No achievements found</p>
        </div>
      )}
    </div>
  );
}
