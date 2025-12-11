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
      <div className="w-full">
        {/* Full Width Main Feed */}
        <div className="w-full min-h-screen">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-[2000px] mx-auto px-8 py-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Community</h1>
            </div>

            {/* Twitter-style tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800">
              <div className="max-w-[2000px] mx-auto px-8 flex">
                <button
                  onClick={() => setActiveTab('all_local')}
                  className={`max-w-[200px] px-4 py-4 text-[15px] font-semibold hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors relative ${
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
                    className={`max-w-[200px] px-4 py-4 text-[15px] font-semibold hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors relative ${
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
                    className={`max-w-[200px] px-4 py-4 text-[15px] font-semibold hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors relative ${
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
          </div>

          {/* Posts Grid - Full Width */}
          <div className="max-w-[2000px] mx-auto px-8 py-6">
            {posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
                </div>

                {displayCount < posts.length && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setDisplayCount(prev => Math.min(prev + 25, posts.length))}
                      className="px-8 py-3 text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                    >
                      Show more posts
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 px-4">
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
        </div>
      </div>
    </div>
  );
}
