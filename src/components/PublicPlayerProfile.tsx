import { useState, useEffect } from 'react';
import { User, Calendar, Clock, Trophy, Star, Target, Loader2, ArrowLeft, UserPlus, UserMinus, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RatingGraph } from './RatingGraph';
import { followUser, unfollowUser, isFollowing, getFollowCounts } from '../lib/socialUtils';

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
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  profile_picture_url: string | null;
}

interface PublicPlayerProfileProps {
  userId: string;
  onBack: () => void;
}

export function PublicPlayerProfile({ userId, onBack }: PublicPlayerProfileProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    fetchPlayerData();
    if (user) {
      checkFollowStatus();
    }
    loadFollowCounts();
  }, [userId]);

  const fetchPlayerData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, created_at, profile_picture_url')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        alert(`Unable to load profile: ${profileError.message}`);
        return;
      }

      if (!profileData) {
        console.error('Profile not found for user:', userId);
        alert('Profile not found');
        return;
      }

      setProfile(profileData);

      const { data: statsData } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

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
    } catch (error: any) {
      console.error('Error fetching player data:', error);
      alert(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    const status = await isFollowing(userId);
    setFollowing(status);
  };

  const loadFollowCounts = async () => {
    const counts = await getFollowCounts(userId);
    setFollowCounts(counts);
  };

  const handleFollowToggle = async () => {
    if (!user) return;

    setFollowLoading(true);
    if (following) {
      const result = await unfollowUser(userId);
      if (result.success) {
        setFollowing(false);
        setFollowCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
      }
    } else {
      const result = await followUser(userId);
      if (result.success) {
        setFollowing(true);
        setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    }
    setFollowLoading(false);
  };

  const handleStartMessage = () => {
    if (!user) {
      alert('Please sign in to send messages');
      return;
    }
    navigate(`/messages?user=${userId}`);
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

  if (!profile || !stats) {
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
      bgColor: 'bg-green-50',
      iconColor: 'text-green-700',
    },
  ];

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8"
        >
          <div className="px-4 sm:px-8 pt-8 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white shadow-lg flex-shrink-0">
                {profile.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-green-700 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 w-full sm:w-auto">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Name */}
                    <h1
                      className="text-2xl font-bold text-slate-900 mb-1"
                    >
                      {profile.full_name}
                    </h1>
                    {/* Follow counts */}
                    <div className="flex items-center gap-4 mt-1">
                      <div>
                        <span className="font-bold text-sm text-slate-900">{followCounts.followers}</span>
                        <span className="text-slate-400 ml-1 text-sm">followers</span>
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900">{followCounts.following}</span>
                        <span className="text-slate-400 ml-1 text-sm">following</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!isOwnProfile && user && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleStartMessage}
                        className="px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 flex-shrink-0 text-sm border border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Message</span>
                      </button>
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 flex-shrink-0 text-sm ${
                          following
                            ? 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                            : 'bg-green-700 hover:bg-green-800 text-white'
                        }`}
                      >
                        {followLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : following ? (
                          <>
                            <UserMinus className="w-4 h-4" />
                            <span className="hidden sm:inline">Unfollow</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Follow</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Badges / Tags */}
            <div className="flex flex-wrap gap-2 mt-6">
              <div className="bg-green-50 text-green-700 rounded-lg px-3 py-1.5">
                <span className="text-xs font-medium">Member since</span>
                <p className="font-semibold text-sm">{formatDate(profile.created_at)}</p>
              </div>
              {stats.skill_level && (
                <div className="bg-green-50 text-green-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <div>
                    <span className="text-xs font-medium">Skill Level</span>
                    <p className="font-semibold text-sm">
                      {stats.skill_level.charAt(0).toUpperCase() + stats.skill_level.slice(1)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* DUPR Performance Section */}
        {stats.dupr_rating !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-6 h-6 text-green-700" />
              <h2
                className="text-xl font-bold text-slate-900"
              >
                DUPR Performance
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-500 font-medium mb-1">Rating</div>
                  <div className="text-2xl font-bold text-slate-900">{stats.dupr_rating.toFixed(2)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-500 font-medium mb-1">Matches</div>
                  <div className="text-2xl font-bold text-slate-900">{stats.total_matches}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-500 font-medium mb-1">Win Rate</div>
                  <div className="text-2xl font-bold text-green-700">
                    {stats.total_matches > 0 ? ((stats.matches_won / stats.total_matches) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
              <div>
                <RatingGraph userId={userId} days={30} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="mb-8"
        >
          <h2
            className="text-xl font-bold text-slate-900 mb-4"
          >
            Statistics
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + index * 0.08, ease: 'easeOut' }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 p-5"
              >
                <div className={`p-3 rounded-xl ${stat.bgColor} inline-block mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <h3
                  className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1"
                >
                  {stat.label}
                </h3>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
        >
          <h3
            className="text-xl font-bold text-slate-900 mb-5 flex items-center"
          >
            <Trophy className="w-6 h-6 mr-2 text-green-700" />
            Achievements
          </h3>
          {stats.achievements && stats.achievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.achievements.map((achievement: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
                  className="bg-green-50 text-green-700 p-5 rounded-lg text-center hover:shadow-md transition-shadow border border-green-100"
                >
                  <Trophy className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm font-semibold">{achievement.name}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
              <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                No achievements yet
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
