import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { followUser, unfollowUser } from '../../lib/socialUtils';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  profile_picture_url?: string;
  isFollowing?: boolean;
  followerCount?: number;
}

interface UserSearchProps {
  onProfileClick?: (userId: string) => void;
}

export default function UserSearch({ onProfileClick }: UserSearchProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [processingFollow, setProcessingFollow] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFollowingUsers();
    }
  }, [user]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  async function fetchFollowingUsers() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('social_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (data) {
        setFollowingUsers(new Set(data.map(f => f.following_id)));
      }
    } catch (error) {
      console.error('Error fetching following users:', error);
    }
  }

  async function searchUsers() {
    if (!user) return;

    setLoading(true);
    try {
      const searchTerm = searchQuery.trim();

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, profile_picture_url')
        .neq('id', user.id)
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('full_name', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      if (profiles) {
        const filteredProfiles = profiles.filter(profile => {
          const name = profile.full_name?.toLowerCase() || '';
          const facilityPatterns = ['pickleball heaven', 'pickle n par', 'patchogue ymca', 'pickleheads'];
          return !facilityPatterns.some(pattern => name.includes(pattern));
        });

        const profilesWithFollowCount = await Promise.all(
          filteredProfiles.map(async (profile) => {
            const { count } = await supabase
              .from('social_follows')
              .select('*', { count: 'exact', head: true })
              .eq('following_id', profile.id);

            return {
              ...profile,
              isFollowing: followingUsers.has(profile.id),
              followerCount: count || 0
            };
          })
        );

        setSearchResults(profilesWithFollowCount);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowToggle(userId: string) {
    if (!user || processingFollow) return;

    setProcessingFollow(userId);
    const isCurrentlyFollowing = followingUsers.has(userId);

    try {
      if (isCurrentlyFollowing) {
        const result = await unfollowUser(userId);
        if (result.success) {
          setFollowingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
          setSearchResults(prev =>
            prev.map(u =>
              u.id === userId
                ? { ...u, isFollowing: false, followerCount: (u.followerCount || 1) - 1 }
                : u
            )
          );
        }
      } else {
        const result = await followUser(userId);
        if (result.success) {
          setFollowingUsers(prev => new Set(prev).add(userId));
          setSearchResults(prev =>
            prev.map(u =>
              u.id === userId
                ? { ...u, isFollowing: true, followerCount: (u.followerCount || 0) + 1 }
                : u
            )
          );
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setProcessingFollow(null);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-[56px] z-10 bg-white border-b border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-slate-900 placeholder-slate-500 transition-all"
          />
        </div>
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        )}

        {!loading && searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
          <div className="text-center py-12 text-slate-500">
            Type at least 2 characters to search
          </div>
        )}

        {!loading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-green-700" />
            </div>
            <p className="text-slate-900 text-lg font-semibold">No users found</p>
            <p className="text-slate-500 text-sm mt-2">Try a different search term</p>
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all"
              >
                <button
                  onClick={() => onProfileClick?.(profile.id)}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm ${
                    profile.profile_picture_url
                      ? 'bg-white'
                      : 'bg-gradient-to-br from-green-600 to-green-700'
                  }`}>
                    {profile.profile_picture_url ? (
                      <img
                        src={profile.profile_picture_url}
                        alt={profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">{profile.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-bold text-slate-900 truncate">
                      {profile.full_name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {profile.email}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {profile.followerCount || 0} {profile.followerCount === 1 ? 'follower' : 'followers'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleFollowToggle(profile.id)}
                  disabled={processingFollow === profile.id}
                  className={`rounded-lg font-semibold text-xs transition-all duration-200 flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
                    profile.isFollowing
                      ? 'bg-slate-100 text-slate-600 px-4 py-2 hover:bg-slate-200'
                      : 'bg-green-700 text-white px-4 py-2 hover:bg-green-800'
                  }`}
                >
                  {processingFollow === profile.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : profile.isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      <span className="hidden sm:inline">Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">Follow</span>
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && searchQuery.trim().length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-50 rounded-2xl flex items-center justify-center">
              <Search className="w-10 h-10 text-green-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Search for Players</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              Find and follow other players in your community. Start by typing a name or email address above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
