import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
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
  const [displayCount, setDisplayCount] = useState(3);

  useEffect(() => {
    if (user) {
      fetchUserFacility();
    }
  }, [user]);

  useEffect(() => {
    setDisplayCount(3);
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
        limit: 50
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
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header with filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Community</h1>
          <button
            onClick={() => loadPosts(true)}
            disabled={refreshing}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex px-2 pb-3 gap-2">
          <button
            onClick={() => setActiveTab('all_local')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'all_local'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Posts
          </button>
          {user && userFacilityId && (
            <button
              onClick={() => setActiveTab('my_club')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'my_club'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              My Club
            </button>
          )}
          {user && (
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'following'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Following
            </button>
          )}
        </div>
      </div>

      {/* Posts */}
      {posts.length > 0 ? (
        <div className="max-w-2xl mx-auto">
          <div className="divide-y divide-gray-200">
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
            <div className="text-center py-8">
              <button
                onClick={() => setDisplayCount(prev => Math.min(prev + 5, posts.length))}
                className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition font-medium shadow-sm"
              >
                Show More ({posts.length - displayCount} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <div className="text-6xl mb-4">📣</div>
          <p className="text-gray-600 font-medium mb-2">No posts yet</p>
          <p className="text-sm text-gray-500 mb-4">
            {activeTab === 'following'
              ? 'Follow some players to see their posts here'
              : user
              ? 'Be the first to share something!'
              : 'Sign in to create posts and join the conversation'}
          </p>
          {user && (
            <button
              onClick={onCreatePost}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Post
            </button>
          )}
        </div>
      )}
    </div>
  );
}
