import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Clock, Trophy, DollarSign, Loader2, Star, Target, Flame, Award, Activity as ActivityIcon, CreditCard, X, RefreshCw, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RatingGraph } from './RatingGraph';
import ProfilePictureUpload from './ProfilePictureUpload';
import { Streak, Activity, getActivityFeed } from '../lib/activityUtils';
import ActivityCard from './ActivityCard';
import PlayerCard from './PlayerCard';
import AchievementsShowcase from './AchievementsShowcase';
import PlayStreakWidget from './PlayStreakWidget';
import { clearAllCaches } from '../utils/cacheUtils';

interface PlayerStats {
  total_bookings: number;
  total_hours_played: number;
  total_lessons_taken: number;
  total_events_participated: number;
  total_spent: number;
  skill_level: string | null;
  achievements: any[];
  dupr_rating: number | null;
  total_matches: number;
  matches_won: number;
}

interface UserProfile {
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  profile_picture_url: string | null;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

const tabItems = ['Posts', 'Stats', 'Achievements'] as const;

export function PlayerProfile() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [activeTab, setActiveTab] = useState<typeof tabItems[number]>('Stats');

  useEffect(() => {
    if (user) {
      fetchPlayerData();
    }
  }, [user]);

  const fetchPlayerData = async () => {
    if (!user) return;

    try {
      const [{ data: statsData }, { data: profileData }, { data: streaksData }, activitiesData] = await Promise.all([
        supabase
          .from('player_stats')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('full_name, email, phone, created_at, profile_picture_url')
          .eq('id', user.id)
          .single(),
        supabase
          .from('streaks')
          .select('*')
          .eq('user_id', user.id),
        getActivityFeed({ userId: user.id, limit: 3 })
      ]);

      if (statsData) {
        setStats(statsData);
      } else {
        setStats({
          total_bookings: 0,
          total_hours_played: 0,
          total_lessons_taken: 0,
          total_events_participated: 0,
          total_spent: 0,
          skill_level: null,
          achievements: [],
          dupr_rating: null,
          total_matches: 0,
          matches_won: 0,
        });
      }

      setProfile(profileData);
      setStreaks(streaksData || []);
      setActivities(activitiesData || []);
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-12 h-12 text-green-700 animate-spin" />
      </div>
    );
  }

  if (!stats || !profile) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 text-lg">Unable to load profile</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Bookings',
      value: stats.total_bookings,
      icon: Calendar,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-700',
    },
    {
      label: 'Hours Played',
      value: Number(stats.total_hours_played).toFixed(1),
      icon: Clock,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-700',
    },
    {
      label: 'Events Joined',
      value: stats.total_events_participated,
      icon: Trophy,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-700',
    },
    {
      label: 'Total Spent',
      value: `$${Number(stats.total_spent).toFixed(2)}`,
      icon: DollarSign,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-700',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <motion.div
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-center gap-5">
              <div className="ring-4 ring-white shadow-lg rounded-full">
                <ProfilePictureUpload
                  currentPictureUrl={profile.profile_picture_url || undefined}
                  onUploadComplete={(url) => {
                    setProfile({ ...profile, profile_picture_url: url });
                  }}
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {profile.full_name}
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Member since {formatDate(profile.created_at)}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {stats.skill_level && (
                    <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-lg">
                      {stats.skill_level.charAt(0).toUpperCase() + stats.skill_level.slice(1)}
                    </span>
                  )}
                  {stats.dupr_rating !== null && (
                    <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-lg">
                      DUPR {stats.dupr_rating.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="bg-slate-50 rounded-xl p-4 mt-5 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900">{stats.total_bookings}</div>
                <div className="text-xs text-slate-400 font-medium">Bookings</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900">{stats.total_events_participated}</div>
                <div className="text-xs text-slate-400 font-medium">Events</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900">{stats.total_matches}</div>
                <div className="text-xs text-slate-400 font-medium">Matches</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setShowPlayerCard(!showPlayerCard)}
                className="bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold px-6 py-2.5 shadow-sm transition-colors flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                View Player Card
              </button>
              {profile.phone && (
                <button className="border border-slate-200 text-slate-700 rounded-xl font-semibold px-6 py-2.5 hover:bg-slate-50 transition-colors">
                  Contact
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 border-t border-slate-100">
            <div className="flex items-center gap-6">
              {tabItems.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative text-sm font-semibold py-3 transition-colors ${
                    activeTab === tab ? 'text-green-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="profileTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Play Streak Widget */}
        {user && (
          <motion.div
            className="mb-8"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <PlayStreakWidget userId={user.id} />
          </motion.div>
        )}

        {/* Streaks */}
        {streaks.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            {streaks.map((streak) => {
              const streakConfig = {
                daily: { icon: Calendar, label: 'Day Streak', bgClass: 'bg-green-50', textClass: 'text-green-700', badgeClass: 'text-green-900' },
                win_streak: { icon: Trophy, label: 'Win Streak', bgClass: 'bg-amber-50', textClass: 'text-amber-700', badgeClass: 'text-amber-900' },
                weekly: { icon: Flame, label: 'Week Streak', bgClass: 'bg-green-50', textClass: 'text-green-700', badgeClass: 'text-green-900' }
              }[streak.streak_type];

              if (!streakConfig || streak.current_count === 0) return null;

              const Icon = streakConfig.icon;
              return (
                <div key={streak.id} className={`${streakConfig.bgClass} rounded-2xl border border-slate-100 shadow-sm px-5 py-4`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${streakConfig.textClass}`} />
                      <span className={`text-xs font-semibold ${streakConfig.textClass}`}>{streakConfig.label}</span>
                    </div>
                    <span className={`text-2xl font-bold ${streakConfig.badgeClass}`}>{streak.current_count}</span>
                  </div>
                  <div className={`text-xs ${streakConfig.textClass} opacity-70`}>
                    Best: {streak.longest_count}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Badges */}
        {stats.achievements && stats.achievements.length > 0 && (
          <motion.div
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Badges</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.achievements.slice(0, 6).map((achievement: any, index: number) => (
                <div
                  key={index}
                  className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{achievement.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* DUPR Performance */}
        {stats.dupr_rating !== null && (
          <motion.div
            className="mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-5 h-5 text-green-700" />
              <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>DUPR Performance</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-5 text-center">
                  <div className="text-xs text-green-700 font-medium uppercase tracking-wide mb-2">Rating</div>
                  <div className="text-3xl font-bold text-green-700">{stats.dupr_rating.toFixed(2)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-5 text-center">
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Matches</div>
                  <div className="text-3xl font-bold text-slate-900">{stats.total_matches}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-5 text-center">
                  <div className="text-xs text-green-700 font-medium uppercase tracking-wide mb-2">Win Rate</div>
                  <div className="text-3xl font-bold text-green-700">
                    {stats.total_matches > 0 ? ((stats.matches_won / stats.total_matches) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
              <div>
                <RatingGraph userId={user!.id} days={30} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Player Card Modal */}
        {showPlayerCard && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPlayerCard(false)}>
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="sticky top-0 bg-green-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>Player Card</h3>
                <button
                  onClick={() => setShowPlayerCard(false)}
                  className="text-white hover:bg-green-800 rounded-lg p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <PlayerCard playerId={user!.id} playerData={{ ...profile, ...stats }} />
              </div>
            </motion.div>
          </div>
        )}

        {/* Recent Activities */}
        <motion.div
          className="mb-8"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={5}
        >
          <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <ActivityIcon className="w-5 h-5 text-green-700" />
            Recent Activities
          </h2>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} onUpdate={fetchPlayerData} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
              <ActivityIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-700 font-medium mb-2">No activities yet</p>
              <p className="text-sm text-slate-400">Start recording your matches and practice sessions to see them here</p>
            </div>
          )}
        </motion.div>

        {/* Statistics */}
        <motion.div
          className="mb-8"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={6}
        >
          <h2 className="text-xl font-bold text-slate-900 mb-5" style={{ fontFamily: 'Manrope, sans-serif' }}>Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((stat, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 p-5"
                whileHover={{ y: -2 }}
              >
                <div className={`p-3 rounded-xl ${stat.bgColor} inline-block mb-4`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
                  {stat.label}
                </h3>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={7}
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <Trophy className="w-5 h-5 text-amber-500" />
            Achievements
          </h3>
          {stats.achievements && stats.achievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {stats.achievements.map((achievement: any, index: number) => (
                <div
                  key={index}
                  className="bg-amber-50 p-5 rounded-xl text-center hover:shadow-md transition-shadow"
                >
                  <Trophy className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-900">{achievement.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
              <Trophy className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No achievements yet</p>
              <p className="text-sm text-slate-400 mt-2">
                Keep playing to unlock achievements!
              </p>
            </div>
          )}
        </motion.div>

        {/* Achievements Showcase */}
        <motion.div
          className="mb-8"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={8}
        >
          {user && <AchievementsShowcase userId={user.id} isOwnProfile={true} />}
        </motion.div>

        {/* Settings */}
        <motion.div
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={9}
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-slate-500" />
            <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="border-t border-slate-100 pt-4">
              <h3 className="font-semibold text-slate-700 mb-2">App Performance</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">
                If you're experiencing issues with updates not appearing or the app not loading correctly, clear the cache.
              </p>
              <button
                onClick={() => {
                  if (confirm('This will clear all cached data and reload the app. Continue?')) {
                    clearAllCaches();
                  }
                }}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold px-6 py-2.5 shadow-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
