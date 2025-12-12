import { useState, useEffect } from 'react';
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
        const profilesWithFollowCount = await Promise.all(
          profiles.map(async (profile) => {
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
      <div className="sticky top-[56px] z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
          />
        </div>
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        )}

        {!loading && searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Type at least 2 characters to search
          </div>
        )}

        {!loading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">No users found</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Try a different search term</p>
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
              >
                <button
                  onClick={() => onProfileClick?.(profile.id)}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ${
                    profile.profile_picture_url
                      ? 'bg-white'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600'
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
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {profile.full_name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {profile.email}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {profile.followerCount || 0} {profile.followerCount === 1 ? 'follower' : 'followers'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleFollowToggle(profile.id)}
                  disabled={processingFollow === profile.id}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                    profile.isFollowing
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processingFollow === profile.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : profile.isFollowing ? (
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
            ))}
          </div>
        )}

        {!loading && searchQuery.trim().length === 0 && (
          <div className="text-center py-16">
            <Search className="w-20 h-20 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Search for Players</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Find and follow other players in your community. Start by typing a name or email address above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
