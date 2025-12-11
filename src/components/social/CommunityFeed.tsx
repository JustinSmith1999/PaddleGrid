import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Users, Calendar, MapPin, Building2 } from 'lucide-react';
import { SocialPost, getFeedPosts } from '../../lib/socialUtils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import PostCard from './PostCard';

interface CommunityFeedProps {
  onCreatePost: () => void;
  onPostClick: (postId: string) => void;
  onClubClick?: (facilityId: string) => void;
  onProfileClick?: (userId: string) => void;
}

export default function CommunityFeed({ onCreatePost, onPostClick, onClubClick, onProfileClick }: CommunityFeedProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'my_club' | 'following' | 'all_local'>('all_local');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userFacilityId, setUserFacilityId] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(25);

  useEffect(() => {
    if (user) {
      fetchUserFacility();
    }
  }, [user]);

  useEffect(() => {
    setDisplayCount(25);
    loadPosts();
  }, [activeTab, userFacilityId]);

  async function fetchUserFacility() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('facility_users')
        .select('facility_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setUserFacilityId(data.facility_id);
      }
    } catch (error) {
      console.error('Error fetching user facility:', error);
    }
  }

  async function loadPosts(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const feedPosts = await getFeedPosts({
        type: activeTab,
        facilityId: activeTab === 'my_club' ? userFacilityId || undefined : undefined,
        limit: 100
      });

      setPosts(feedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="flex w-full max-w-[1600px] mx-auto">
        {/* Main Feed - Takes most of the space */}
        <div className="flex-1 min-w-0 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 -mx-6 sm:-mx-8 md:-mx-12 lg:-mx-16 xl:-mx-24 2xl:-mx-32 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32">
            <div className="py-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Community</h1>
            </div>

            {/* Twitter-style tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('all_local')}
                className={`flex-1 px-4 py-4 text-[15px] font-semibold hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors relative ${
                  activeTab === 'all_local'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                For You
                {activeTab === 'all_local' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-full" />
                )}
              </button>

              {user && userFacilityId && (
                <button
                  onClick={() => setActiveTab('my_club')}
                  className={`flex-1 px-4 py-4 text-[15px] font-semibold hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors relative ${
                    activeTab === 'my_club'
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  My Club
                  {activeTab === 'my_club' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-full" />
                  )}
                </button>
              )}

              {user && (
                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 px-4 py-4 text-[15px] font-semibold hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors relative ${
                    activeTab === 'following'
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Following
                  {activeTab === 'following' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-full" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Posts Feed */}
          {posts.length > 0 ? (
            <>
              {posts.slice(0, displayCount).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => onPostClick(post.id)}
                  onUpdate={() => loadPosts(true)}
                  onClubClick={onClubClick}
                  onProfileClick={onProfileClick}
                />
              ))}

              {displayCount < posts.length && (
                <div className="border-b border-slate-200 dark:border-slate-800 p-4">
                  <button
                    onClick={() => setDisplayCount(prev => Math.min(prev + 25, posts.length))}
                    className="w-full py-3 text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                  >
                    Show more posts
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 px-4 border-b border-slate-200 dark:border-slate-800">
              <div className="text-6xl mb-4">📣</div>
              <p className="text-slate-900 dark:text-white font-semibold text-lg mb-2">No posts yet</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                {activeTab === 'following'
                  ? 'Follow some players to see their posts here'
                  : user
                  ? 'Be the first to share something!'
                  : 'Sign in to create posts and join the conversation'}
              </p>
              {user && (
                <button
                  onClick={onCreatePost}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors shadow-lg"
                >
                  Create Post
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Trending & Suggestions */}
        <div className="hidden lg:block w-[340px] xl:w-[380px] flex-shrink-0 pl-6 pr-8 py-4">
          <div className="sticky top-4 space-y-4">
            {/* Trending Topics */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Trending</h2>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                <button className="w-full px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Pickleball · Trending</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">DUPR Ratings</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">2.5K posts</div>
                </button>
                <button className="w-full px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Calendar className="w-3 h-3" />
                    <span>Events · This Week</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">Weekend Tournaments</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">850 posts</div>
                </button>
                <button className="w-full px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Building2 className="w-3 h-3" />
                    <span>Local · Popular</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">New Courts Opening</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">1.2K posts</div>
                </button>
              </div>
            </div>

            {/* Who to Follow */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Clubs Near You</h2>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                <div className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">Pickleball Heaven</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>Chicago, IL</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Users className="w-3 h-3" />
                        <span>234 members</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 space-x-2">
              <a href="#" className="hover:underline">Terms</a>
              <span>·</span>
              <a href="#" className="hover:underline">Privacy</a>
              <span>·</span>
              <a href="#" className="hover:underline">Help</a>
              <div className="mt-2">© 2024 PaddleGrid</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
