import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const cardHover = {
  y: -3,
  shadow: '0 4px 12px rgba(0,0,0,0.06)',
  transition: { duration: 0.2 },
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
      <div className="min-h-screen bg-[#F8F9FC] flex justify-center items-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="w-12 h-12 text-green-700 animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (!stats || !profile) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex justify-center items-center py-12">
        <motion.div
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p
            className="text-slate-500 text-lg"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Unable to load profile
          </p>
        </motion.div>
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
    <div className="min-h-screen bg-[#F8F9FC]">
      <motion.div
        className="max-w-6xl mx-auto px-4 py-8 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Profile Header Card */}
        <motion.div
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
          variants={sectionVariants}
        >
          <div className="p-6">
            <div className="flex items-center gap-5">
              <div className="ring-2 ring-white shadow-sm rounded-full">
                <ProfilePictureUpload
                  currentPictureUrl={profile.profile_picture_url || undefined}
                  onUploadComplete={(url) => {
                    setProfile({ ...profile, profile_picture_url: url });
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1
                  className="text-2xl font-bold text-slate-900 mb-1"
                >
                  {profile.full_name}
                </h1>
                <p
                  className="text-sm text-slate-500 leading-relaxed"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  Member since {formatDate(profile.created_at)}
                </p>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  {stats.skill_level && (
                    <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                      {stats.skill_level.charAt(0).toUpperCase() + stats.skill_level.slice(1)}
                    </span>
                  )}
                  {stats.dupr_rating !== null && (
                    <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                      DUPR {stats.dupr_rating.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="bg-[#F8F9FC] rounded-xl p-4 mt-5 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div
                  className="text-xl font-bold text-slate-900"
                >
                  {stats.total_bookings}
                </div>
                <div
                  className="text-xs text-slate-400 font-medium"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  Bookings
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-xl font-bold text-slate-900"
                >
                  {stats.total_events_participated}
                </div>
                <div
                  className="text-xs text-slate-400 font-medium"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  Events
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-xl font-bold text-slate-900"
                >
                  {stats.total_matches}
                </div>
                <div
                  className="text-xs text-slate-400 font-medium"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  Matches
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-5">
              <motion.button
                onClick={() => setShowPlayerCard(!showPlayerCard)}
                className="bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold px-6 py-2.5 shadow-sm transition-colors flex items-center gap-2"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <CreditCard className="w-4 h-4" />
                View Player Card
              </motion.button>
              {profile.phone && (
                <motion.button
                  className="border border-slate-200/60 text-slate-700 rounded-xl font-semibold px-6 py-2.5 hover:bg-slate-50 transition-colors"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Contact
                </motion.button>
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
                  className={`relative text-sm font-semibold py-3.5 transition-colors ${
                    activeTab === tab ? 'text-green-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
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
          <motion.div variants={sectionVariants}>
            <PlayStreakWidget userId={user.id} />
          </motion.div>
        )}

        {/* Streaks */}
        {streaks.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            variants={sectionVariants}
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
                <motion.div
                  key={streak.id}
                  className={`${streakConfig.bgClass} rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-5 py-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200`}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${streakConfig.bgClass} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${streakConfig.textClass}`} />
                      </div>
                      <span
                        className={`text-xs font-semibold ${streakConfig.textClass}`}
                        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                      >
                        {streakConfig.label}
                      </span>
                    </div>
                    <span
                      className={`text-2xl font-bold ${streakConfig.badgeClass}`}
                    >
                      {streak.current_count}
                    </span>
                  </div>
                  <div
                    className={`text-xs ${streakConfig.textClass} opacity-70`}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    Best: {streak.longest_count}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Badges */}
        {stats.achievements && stats.achievements.length > 0 && (
          <motion.div
            className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
            variants={sectionVariants}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-[44px] h-[44px] rounded-xl bg-amber-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-700" />
              </div>
              <h3
                className="text-sm font-bold text-slate-900"
              >
                Badges
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.achievements.slice(0, 6).map((achievement: any, index: number) => (
                <span
                  key={index}
                  className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  {achievement.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* DUPR Performance */}
        {stats.dupr_rating !== null && (
          <motion.div
            className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
            variants={sectionVariants}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[44px] h-[44px] rounded-xl bg-green-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-700" />
              </div>
              <h2
                className="text-xl font-bold text-slate-900"
              >
                DUPR Performance
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  className="bg-green-50 rounded-xl p-5 text-center"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="text-xs text-green-700 font-medium uppercase tracking-wide mb-2"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    Rating
                  </div>
                  <div
                    className="text-3xl font-bold text-green-700"
                  >
                    {stats.dupr_rating.toFixed(2)}
                  </div>
                </motion.div>
                <motion.div
                  className="bg-[#F8F9FC] rounded-xl p-5 text-center"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    Matches
                  </div>
                  <div
                    className="text-3xl font-bold text-slate-900"
                  >
                    {stats.total_matches}
                  </div>
                </motion.div>
                <motion.div
                  className="bg-green-50 rounded-xl p-5 text-center"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="text-xs text-green-700 font-medium uppercase tracking-wide mb-2"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    Win Rate
                  </div>
                  <div
                    className="text-3xl font-bold text-green-700"
                  >
                    {stats.total_matches > 0 ? ((stats.matches_won / stats.total_matches) * 100).toFixed(0) : 0}%
                  </div>
                </motion.div>
              </div>
              <div>
                <RatingGraph userId={user!.id} days={30} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Player Card Modal */}
        <AnimatePresence>
          {showPlayerCard && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowPlayerCard(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] max-w-2xl w-full max-h-[90vh] overflow-auto border border-slate-200/60"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              >
                <div className="sticky top-0 bg-green-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                  <h3
                    className="text-xl font-bold text-white"
                  >
                    Player Card
                  </h3>
                  <button
                    onClick={() => setShowPlayerCard(false)}
                    className="text-white/80 hover:text-white hover:bg-green-800 rounded-xl p-2 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <PlayerCard playerId={user!.id} playerData={{ ...profile, ...stats }} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Activities */}
        <motion.div variants={sectionVariants}>
          <h2
            className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-3"
          >
            <div className="w-[44px] h-[44px] rounded-xl bg-green-50 flex items-center justify-center">
              <ActivityIcon className="w-5 h-5 text-green-700" />
            </div>
            Recent Activities
          </h2>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <ActivityCard activity={activity} onUpdate={fetchPlayerData} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 text-center">
              <ActivityIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p
                className="text-slate-700 font-medium mb-2"
              >
                No activities yet
              </p>
              <p
                className="text-sm text-slate-400"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                Start recording your matches and practice sessions to see them here
              </p>
            </div>
          )}
        </motion.div>

        {/* Statistics */}
        <motion.div variants={sectionVariants}>
          <h2
            className="text-xl font-bold text-slate-900 mb-5"
          >
            Statistics
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 p-6"
                whileHover={{ y: -3 }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
              >
                <div className={`w-[44px] h-[44px] rounded-xl ${stat.bgColor} flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <h3
                  className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {stat.label}
                </h3>
                <p
                  className="text-2xl font-bold text-slate-900"
                >
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
          variants={sectionVariants}
        >
          <h3
            className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3"
          >
            <div className="w-[44px] h-[44px] rounded-xl bg-amber-50 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            Achievements
          </h3>
          {stats.achievements && stats.achievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.achievements.map((achievement: any, index: number) => (
                <motion.div
                  key={index}
                  className="bg-amber-50 p-5 rounded-xl text-center hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 border border-amber-100/60"
                  whileHover={{ y: -2 }}
                >
                  <Trophy className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                  <p
                    className="text-sm font-semibold text-slate-900"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    {achievement.name}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#F8F9FC] rounded-xl">
              <Trophy className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p
                className="text-slate-600 font-medium"
              >
                No achievements yet
              </p>
              <p
                className="text-sm text-slate-400 mt-2"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                Keep playing to unlock achievements!
              </p>
            </div>
          )}
        </motion.div>

        {/* Achievements Showcase */}
        <motion.div variants={sectionVariants}>
          {user && <AchievementsShowcase userId={user.id} isOwnProfile={true} />}
        </motion.div>

        {/* Settings */}
        <motion.div
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
          variants={sectionVariants}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[44px] h-[44px] rounded-xl bg-slate-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-500" />
            </div>
            <h2
              className="text-xl font-bold text-slate-900"
            >
              Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div className="border-t border-slate-100 pt-4">
              <h3
                className="font-semibold text-slate-700 mb-2"
              >
                App Performance
              </h3>
              <p
                className="text-sm text-slate-500 leading-relaxed mb-3"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                If you're experiencing issues with updates not appearing or the app not loading correctly, clear the cache.
              </p>
              <motion.button
                onClick={() => {
                  if (confirm('This will clear all cached data and reload the app. Continue?')) {
                    clearAllCaches();
                  }
                }}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold px-6 py-2.5 shadow-sm transition-colors"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4" />
                Clear Cache & Reload
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
