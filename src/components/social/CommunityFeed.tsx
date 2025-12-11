import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Users, Calendar, MapPin, Building2, Home, Search, Bell, MessageCircle, User, Bookmark, MoreHorizontal, PlusCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="flex w-full max-w-[1600px] mx-auto">
        {/* Left Sidebar Navigation */}
        <div className="hidden lg:flex w-[280px] xl:w-[300px] flex-shrink-0 flex-col fixed left-0 h-screen border-r border-slate-200/80 dark:border-slate-800/80 px-4 xl:px-8 py-4">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            <button className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group bg-emerald-50/50 dark:bg-emerald-900/10">
              <Home className="w-6 h-6 text-slate-900 dark:text-white" />
              <span className="text-lg font-bold text-slate-900 dark:text-white">Feed</span>
            </button>

            <button className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group">
              <Search className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              <span className="text-lg font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Explore</span>
            </button>

            {user && (
              <>
                <button className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group relative">
                  <Bell className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                  <span className="text-lg font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Notifications</span>
                  <span className="absolute top-2 left-7 w-2 h-2 bg-emerald-500 rounded-full"></span>
                </button>

                <button className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group">
                  <MessageCircle className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                  <span className="text-lg font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Messages</span>
                </button>

                <button className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group">
                  <Bookmark className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                  <span className="text-lg font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Bookmarks</span>
                </button>

                <button className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group">
                  <User className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                  <span className="text-lg font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Profile</span>
                </button>

                <button className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group">
                  <MoreHorizontal className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                  <span className="text-lg font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">More</span>
                </button>
              </>
            )}
          </nav>

          {/* Post Button */}
          {user && (
            <button
              onClick={onCreatePost}
              className="w-full mb-4 py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-6 h-6" />
              <span>Post</span>
            </button>
          )}

          {/* User Profile */}
          {user && profile && (
            <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">
                {profile.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{profile.full_name || 'User'}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">@{profile.full_name?.toLowerCase().replace(' ', '') || 'user'}</div>
              </div>
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </div>
          )}
        </div>

        {/* Main Feed - Centered with fixed width */}
        <div className="flex-1 min-w-0 lg:ml-[280px] xl:ml-[300px] lg:max-w-[600px] xl:max-w-[650px] border-r border-slate-200/80 dark:border-slate-800/80">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="py-5 lg:py-6 px-4">
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Community</h1>
            </div>

            {/* Twitter-style tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('all_local')}
                className={`flex-1 px-4 py-4 text-base lg:text-lg font-bold hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all relative ${
                  activeTab === 'all_local'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                For You
                {activeTab === 'all_local' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg shadow-emerald-500/50" />
                )}
              </button>

              {user && userFacilityId && (
                <button
                  onClick={() => setActiveTab('my_club')}
                  className={`flex-1 px-4 py-4 text-base lg:text-lg font-bold hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all relative ${
                    activeTab === 'my_club'
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  My Club
                  {activeTab === 'my_club' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg shadow-emerald-500/50" />
                  )}
                </button>
              )}

              {user && (
                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 px-4 py-4 text-base lg:text-lg font-bold hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all relative ${
                    activeTab === 'following'
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Following
                  {activeTab === 'following' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg shadow-emerald-500/50" />
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
        <div className="hidden xl:block w-[380px] 2xl:w-[420px] flex-shrink-0 pl-8 pr-8 py-6">
          <div className="sticky top-4 space-y-6">
            {/* Trending Topics */}
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40">
              <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80">
                <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Trending</h2>
              </div>
              <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                <button className="w-full px-6 py-4 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10 transition-all duration-200 text-left group">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                    <span>Pickleball · Trending</span>
                  </div>
                  <div className="font-black text-slate-900 dark:text-white text-base lg:text-lg mb-1">DUPR Ratings</div>
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">3.8K posts</div>
                </button>
                <button className="w-full px-6 py-4 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10 transition-all duration-200 text-left group">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <Calendar className="w-4 h-4" />
                    <span>Events · This Week</span>
                  </div>
                  <div className="font-black text-slate-900 dark:text-white text-base lg:text-lg mb-1">Weekend Tournaments</div>
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">1.4K posts</div>
                </button>
                <button className="w-full px-6 py-4 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10 transition-all duration-200 text-left group">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <Building2 className="w-4 h-4" />
                    <span>Local · Popular</span>
                  </div>
                  <div className="font-black text-slate-900 dark:text-white text-base lg:text-lg mb-1">New Courts Opening</div>
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">2.1K posts</div>
                </button>
                <button className="w-full px-6 py-4 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10 transition-all duration-200 text-left group">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                    <span>Equipment · Trending</span>
                  </div>
                  <div className="font-black text-slate-900 dark:text-white text-base lg:text-lg mb-1">Best Paddles 2025</div>
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">987 posts</div>
                </button>
                <button className="w-full px-6 py-4 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10 transition-all duration-200 text-left group">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <Users className="w-4 h-4" />
                    <span>Community · Growing</span>
                  </div>
                  <div className="font-black text-slate-900 dark:text-white text-base lg:text-lg mb-1">Social Mixers</div>
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">1.8K posts</div>
                </button>
                <button className="w-full px-6 py-4 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10 transition-all duration-200 text-left group">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                    <span>Strategy · Hot</span>
                  </div>
                  <div className="font-black text-slate-900 dark:text-white text-base lg:text-lg mb-1">Third Shot Drop Tips</div>
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">1.5K posts</div>
                </button>
              </div>
            </div>

            {/* Clubs Near You */}
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40">
              <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80">
                <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Clubs Near You</h2>
              </div>
              <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                <div className="px-6 py-5 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30 group-hover:shadow-xl group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all duration-200">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 dark:text-white text-base lg:text-lg mb-2">Pickleball Heaven</div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>Chicago, IL</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        <Users className="w-4 h-4" />
                        <span>487 members</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50 dark:hover:from-blue-900/10 dark:hover:to-cyan-900/10 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-200">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 dark:text-white text-base lg:text-lg mb-2">Metro Courts</div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>Chicago, IL</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                        <Users className="w-4 h-4" />
                        <span>832 members</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-5 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-orange-900/10 dark:hover:to-red-900/10 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30 group-hover:shadow-xl group-hover:shadow-orange-500/40 group-hover:scale-105 transition-all duration-200">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 dark:text-white text-base lg:text-lg mb-2">Windy City Pickleball</div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>Chicago, IL</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
                        <Users className="w-4 h-4" />
                        <span>1.2K members</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-5 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 dark:hover:from-purple-900/10 dark:hover:to-pink-900/10 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 group-hover:scale-105 transition-all duration-200">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 dark:text-white text-base lg:text-lg mb-2">Lakeshore Athletic Club</div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>Chicago, IL</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
                        <Users className="w-4 h-4" />
                        <span>654 members</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 space-x-3">
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms</a>
              <span>·</span>
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy</a>
              <span>·</span>
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Help</a>
              <div className="mt-2 font-semibold">© 2025 PaddleGrid</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
