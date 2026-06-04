import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Star, Target, TrendingUp, Award, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: string;
  criteria: any;
  unlocked_at?: string;
  progress?: number;
}

interface AchievementsShowcaseProps {
  userId: string;
  isOwnProfile?: boolean;
  compact?: boolean;
}

export default function AchievementsShowcase({
  userId,
  isOwnProfile = false,
  compact = false
}: AchievementsShowcaseProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, unlocked: 0, points: 0 });

  useEffect(() => {
    fetchAchievements();
  }, [userId, filter, categoryFilter]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);

      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: false });

      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      const mergedAchievements = (allAchievements || []).map(ach => {
        const userAch = userAchievements?.find(ua => ua.achievement_id === ach.id);
        return {
          ...ach,
          unlocked_at: userAch?.unlocked_at,
          progress: userAch?.progress || 0
        };
      });

      let filtered = mergedAchievements;

      if (filter === 'unlocked') {
        filtered = filtered.filter(a => a.unlocked_at);
      } else if (filter === 'locked') {
        filtered = filtered.filter(a => !a.unlocked_at);
      }

      if (categoryFilter !== 'all') {
        filtered = filtered.filter(a => a.category === categoryFilter);
      }

      setAchievements(filtered);

      const totalPoints = userAchievements
        ?.filter(ua => ua.unlocked_at)
        .reduce((sum, ua) => {
          const ach = allAchievements?.find(a => a.id === ua.achievement_id);
          return sum + (ach?.points || 0);
        }, 0) || 0;

      setStats({
        total: allAchievements?.length || 0,
        unlocked: userAchievements?.filter(ua => ua.unlocked_at).length || 0,
        points: totalPoints
      });
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      case 'uncommon': return 'from-green-400 to-green-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 shadow-lg shadow-yellow-400/20';
      case 'epic': return 'border-purple-400 shadow-lg shadow-purple-400/20';
      case 'rare': return 'border-blue-400 shadow-lg shadow-blue-400/20';
      case 'uncommon': return 'border-green-400 shadow-lg shadow-green-400/20';
      default: return 'border-slate-200';
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      trophy: Trophy,
      star: Star,
      target: Target,
      trending: TrendingUp,
      award: Award,
      sparkles: Sparkles
    };
    return icons[iconName] || Trophy;
  };

  const getProgressPercentage = (achievement: Achievement) => {
    const target = achievement.criteria?.target || 1;
    return Math.min((achievement.progress / target) * 100, 100);
  };

  if (compact) {
    const featuredAchievements = achievements.filter(a => a.unlocked_at).slice(0, 3);

    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            Featured Achievements
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Trophy className="w-4 h-4 text-green-700" />
            <span className="font-semibold text-green-700">{stats.unlocked}/{stats.total}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {featuredAchievements.map((achievement, index) => {
            const Icon = getIconComponent(achievement.icon);
            return (
              <motion.div
                key={achievement.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                className="bg-green-50 text-green-700 rounded-xl p-3 text-center group hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="relative">
                  <Icon className="w-8 h-8 text-green-700 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-green-700 line-clamp-2">
                    {achievement.name}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">Total Points</span>
          <span className="font-bold text-green-700">{stats.points.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Achievements
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <Trophy className="w-8 h-8 text-green-700 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">{stats.unlocked}</div>
            <div className="text-xs text-slate-500">Unlocked</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <Star className="w-8 h-8 text-green-700 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">{stats.points.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Points</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <Target className="w-8 h-8 text-green-700 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">
              {Math.round((stats.unlocked / stats.total) * 100)}%
            </div>
            <div className="text-xs text-slate-500">Complete</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'unlocked', 'locked'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                filter === f
                  ? 'bg-green-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {['all', 'matches', 'hours', 'social', 'competitive', 'milestones'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-green-50 text-green-700'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-slate-300 animate-pulse mx-auto mb-2" />
          <p className="text-slate-400">Loading achievements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => {
            const Icon = getIconComponent(achievement.icon);
            const isUnlocked = !!achievement.unlocked_at;
            const progress = getProgressPercentage(achievement);

            return (
              <motion.div
                key={achievement.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
                className={`relative border-2 rounded-xl p-4 transition-all hover:shadow-lg ${
                  isUnlocked
                    ? getRarityBorder(achievement.rarity)
                    : 'border-slate-100 bg-slate-50'
                } ${!isUnlocked && 'opacity-60'}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      isUnlocked
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {isUnlocked ? (
                      <Icon className="w-6 h-6" />
                    ) : (
                      <Lock className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 mb-1">
                      {achievement.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {!isUnlocked && isOwnProfile && achievement.progress > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-700 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-lg capitalize ${
                      isUnlocked
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {achievement.rarity}
                  </span>
                  <span className="text-sm font-bold text-green-700">
                    +{achievement.points}
                  </span>
                </div>

                {isUnlocked && achievement.unlocked_at && (
                  <div className="mt-2 text-xs text-slate-400 text-center">
                    Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
