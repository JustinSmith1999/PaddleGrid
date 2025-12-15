import { useState, useEffect } from 'react';
import { User, Calendar, Clock, Trophy, DollarSign, Loader2, Star, Target, Flame, Award, Activity as ActivityIcon, CreditCard, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RatingGraph } from './RatingGraph';
import ProfilePictureUpload from './ProfilePictureUpload';
import { Streak, Activity, getActivityFeed } from '../lib/activityUtils';
import ActivityCard from './ActivityCard';
import PlayerCard from './PlayerCard';
import AchievementsBadges from './AchievementsBadges';

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

export function PlayerProfile() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlayerCard, setShowPlayerCard] = useState(false);

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
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!stats || !profile) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-md">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Unable to load profile</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Bookings',
      value: stats.total_bookings,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Hours Played',
      value: Number(stats.total_hours_played).toFixed(1),
      icon: Clock,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Events Joined',
      value: stats.total_events_participated,
      icon: Trophy,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      label: 'Total Spent',
      value: `$${Number(stats.total_spent).toFixed(2)}`,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 sm:px-6 pt-5 pb-6">
            <div className="flex items-center gap-4">
              <ProfilePictureUpload
                currentPictureUrl={profile.profile_picture_url || undefined}
                onUploadComplete={(url) => {
                  setProfile({ ...profile, profile_picture_url: url });
                }}
              />
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">{profile.full_name}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-emerald-100" />
                    <p className="text-emerald-50 text-sm sm:text-base font-semibold">
                      {stats?.dupr_rating ? `${stats.dupr_rating.toFixed(2)} DUPR` : 'Not Rated'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-100" />
                    <p className="text-emerald-50 text-xs sm:text-sm">
                      Member since {formatDate(profile.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPlayerCard(!showPlayerCard)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-600 text-xs font-medium rounded-lg hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md"
                  >
                    <CreditCard className="w-4 h-4" />
                    View Player Card
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {stats.skill_level && (
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg px-3 py-2 shadow-md flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-900" />
                  <div>
                    <span className="text-xs text-yellow-900 uppercase tracking-wide">Skill Level</span>
                    <p className="font-semibold text-yellow-900 text-sm">
                      {stats.skill_level.charAt(0).toUpperCase() + stats.skill_level.slice(1)}
                    </p>
                  </div>
                </div>
              )}
              {profile.phone && (
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Phone</span>
                  <p className="font-semibold text-gray-800 text-sm">{profile.phone}</p>
                </div>
              )}
            </div>

            {streaks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {streaks.map((streak) => {
                  const streakConfig = {
                    daily: { icon: Calendar, label: 'Day Streak', color: 'from-blue-500 to-cyan-500', text: 'text-blue-900', bg: 'bg-blue-50' },
                    win_streak: { icon: Trophy, label: 'Win Streak', color: 'from-yellow-500 to-orange-500', text: 'text-orange-900', bg: 'bg-orange-50' },
                    weekly: { icon: Flame, label: 'Week Streak', color: 'from-purple-500 to-pink-500', text: 'text-purple-900', bg: 'bg-purple-50' }
                  }[streak.streak_type];

                  if (!streakConfig || streak.current_count === 0) return null;

                  const Icon = streakConfig.icon;
                  return (
                    <div key={streak.id} className={`bg-gradient-to-r ${streakConfig.color} rounded-lg px-3 py-2.5 shadow-md`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-4 h-4 text-white" />
                          <span className="text-xs text-white font-semibold">{streakConfig.label}</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{streak.current_count}</span>
                      </div>
                      <div className="text-xs text-white text-opacity-90">
                        Best: {streak.longest_count}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {stats.achievements && stats.achievements.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-gray-700" />
                  <h3 className="text-sm font-bold text-gray-800">Badges</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.achievements.slice(0, 6).map((achievement: any, index: number) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-amber-400 to-amber-500 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-900" />
                      <span className="text-xs font-semibold text-amber-900">{achievement.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {stats.dupr_rating !== null && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-800">DUPR Performance</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 text-center border border-emerald-200 shadow-sm">
                  <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-2">Rating</div>
                  <div className="text-3xl font-bold text-emerald-700">{stats.dupr_rating.toFixed(2)}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 text-center border border-blue-200 shadow-sm">
                  <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-2">Matches</div>
                  <div className="text-3xl font-bold text-blue-700">{stats.total_matches}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 text-center border border-green-200 shadow-sm">
                  <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-2">Win Rate</div>
                  <div className="text-3xl font-bold text-green-700">
                    {stats.total_matches > 0 ? ((stats.matches_won / stats.total_matches) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
              <div>
                <RatingGraph userId={user!.id} days={30} />
              </div>
            </div>
          </div>
        )}

        {showPlayerCard && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPlayerCard(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 flex items-center justify-between border-b border-emerald-700 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white">Player Card</h3>
                <button
                  onClick={() => setShowPlayerCard(false)}
                  className="text-white hover:bg-emerald-700 rounded-lg p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <PlayerCard playerId={user!.id} playerData={{ ...profile, ...stats }} />
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3">
            <ActivityIcon className="w-6 h-6 text-emerald-600" />
            Recent Activities
          </h2>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} onUpdate={fetchPlayerData} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-10 text-center border border-gray-100">
              <ActivityIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">No activities yet</p>
              <p className="text-sm text-gray-500">Start recording your matches and practice sessions to see them here</p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-5">Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-100"
              >
                <div className={`p-3 rounded-xl ${stat.bgColor} inline-block mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
                  {stat.label}
                </h3>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Achievements
          </h3>
          {stats.achievements && stats.achievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {stats.achievements.map((achievement: any, index: number) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200 text-center hover:shadow-md transition-shadow"
                >
                  <Trophy className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-800">{achievement.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No achievements yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Keep playing to unlock achievements!
              </p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <AchievementsBadges />
        </div>
      </div>
    </div>
  );
}
