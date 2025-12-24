import { useState, useEffect } from 'react';
import { User, Calendar, Clock, Trophy, Star, Target, Loader2, ArrowLeft, UserPlus, UserMinus, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!profile || !stats) {
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
  ];

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 sm:px-6 pt-5 pb-14 sm:pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-lg flex-shrink-0">
                {profile.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">{profile.full_name}</h1>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="text-white">
                        <span className="font-bold text-sm">{followCounts.followers}</span>
                        <span className="text-emerald-100 ml-1 text-xs">followers</span>
                      </div>
                      <div className="text-white">
                        <span className="font-bold text-sm">{followCounts.following}</span>
                        <span className="text-emerald-100 ml-1 text-xs">following</span>
                      </div>
                    </div>
                  </div>
                  {!isOwnProfile && user && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleStartMessage}
                        className="px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 flex-shrink-0 text-xs sm:text-sm bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Message</span>
                      </button>
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 flex-shrink-0 text-xs sm:text-sm ${
                          following
                            ? 'bg-white text-emerald-600 hover:bg-gray-100'
                            : 'bg-white text-emerald-600 hover:bg-gray-100'
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
          </div>

          <div className="px-4 sm:px-6 -mt-8 pb-4">
            <div className="flex flex-wrap gap-2">
              <div className="bg-white rounded-lg px-3 py-1.5 shadow-md border border-gray-200">
                <span className="text-xs text-gray-500">Member since</span>
                <p className="font-semibold text-gray-800 text-sm">{formatDate(profile.created_at)}</p>
              </div>
              {stats.skill_level && (
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg px-3 py-1.5 shadow-md flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-900" />
                  <div>
                    <span className="text-xs text-yellow-900">Skill Level</span>
                    <p className="font-semibold text-yellow-900 text-sm">
                      {stats.skill_level.charAt(0).toUpperCase() + stats.skill_level.slice(1)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {stats.dupr_rating !== null && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-800">DUPR Performance</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 text-center border border-emerald-200 shadow-sm">
                  <div className="text-xs text-emerald-600 font-medium mb-1">Rating</div>
                  <div className="text-2xl font-bold text-emerald-700">{stats.dupr_rating.toFixed(2)}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200 shadow-sm">
                  <div className="text-xs text-blue-600 font-medium mb-1">Matches</div>
                  <div className="text-2xl font-bold text-blue-700">{stats.total_matches}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200 shadow-sm">
                  <div className="text-xs text-green-600 font-medium mb-1">Win Rate</div>
                  <div className="text-2xl font-bold text-green-700">
                    {stats.total_matches > 0 ? ((stats.matches_won / stats.total_matches) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
              <div>
                <RatingGraph userId={userId} days={30} />
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-5 border border-gray-100"
              >
                <div className={`p-3 rounded-xl ${stat.bgColor} inline-block mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">
                  {stat.label}
                </h3>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
            Achievements
          </h3>
          {stats.achievements && stats.achievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.achievements.map((achievement: any, index: number) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border border-yellow-200 text-center hover:shadow-md transition-shadow"
                >
                  <Trophy className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">{achievement.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No achievements yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
