import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Loader2 } from 'lucide-react';
import { SocialPost, getFeedPosts } from '../../lib/socialUtils';
import PostCard from './PostCard';

interface TrendingHighlightsProps {
  onPostClick: (postId: string) => void;
  onProfileClick?: (userId: string) => void;
  onClubClick?: (facilityId: string) => void;
}

export default function TrendingHighlights({ onPostClick, onProfileClick, onClubClick }: TrendingHighlightsProps) {
  const [trendingPosts, setTrendingPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'hot' | 'new'>('hot');

  useEffect(() => {
    loadTrendingPosts();
  }, [filter]);

  async function loadTrendingPosts() {
    setLoading(true);
    try {
      const posts = await getFeedPosts({ type: 'all_local', limit: 30 });

      const sorted = posts.sort((a, b) => {
        if (filter === 'new') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });

      setTrendingPosts(sorted.slice(0, 20));
    } catch (error) {
      console.error('Error loading trending posts:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-white">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header with filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Trending</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('hot')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              filter === 'hot'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Hot
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              filter === 'new'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      {/* Posts */}
      {trendingPosts.length > 0 ? (
        <div>
          {trendingPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => onPostClick(post.id)}
              onUpdate={loadTrendingPosts}
              onClubClick={onClubClick}
              onProfileClick={onProfileClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <div className="text-6xl mb-4">🔥</div>
          <p className="text-gray-600 font-medium mb-2">No trending posts yet</p>
          <p className="text-sm text-gray-500">
            Start posting highlights to see them trending here!
          </p>
        </div>
      )}
    </div>
  );
}
