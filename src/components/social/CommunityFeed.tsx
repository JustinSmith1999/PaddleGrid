import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Users, Calendar, MapPin, Building2, Home, Search, Bell, MessageCircle, User, Bookmark, MoreHorizontal, PlusCircle, X, Shield } from 'lucide-react';
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
  const [activeView, setActiveView] = useState<'feed' | 'explore' | 'notifications' | 'messages' | 'bookmarks' | 'profile'>('feed');
  const [activeTab, setActiveTab] = useState<'my_club' | 'following' | 'all_local'>('all_local');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userFacilityId, setUserFacilityId] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(25);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 relative">
      {/* Background Pattern - Desktop Only */}
      <div
        className="hidden lg:block fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/whie_pickleball.webp)',
          backgroundSize: '400px',
          backgroundRepeat: 'repeat',
          filter: 'grayscale(100%)',
          opacity: 0.1
        }}
      />
      <div className="flex justify-center w-full relative z-10">
        {/* Left Sidebar Navigation */}
        <div className="hidden lg:flex w-[275px] flex-shrink-0 flex-col fixed left-[max(0px,calc((100vw-1280px)/2))] h-screen border-r border-slate-200/80 dark:border-slate-800/80 px-6 pt-6 pb-6 overflow-y-auto bg-white dark:bg-slate-900">
          {/* Navigation Links */}
          <nav className="space-y-1 mb-4">
            <button
              onClick={() => setActiveView('feed')}
              className={`flex items-center gap-4 px-4 py-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group ${
                activeView === 'feed' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
              }`}
            >
              <Home className={`w-6 h-6 ${activeView === 'feed' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`} />
              <span className={`text-lg font-semibold ${activeView === 'feed' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`}>Feed</span>
            </button>

            <button
              onClick={() => setActiveView('explore')}
              className={`flex items-center gap-4 px-4 py-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group ${
                activeView === 'explore' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
              }`}
            >
              <Building2 className={`w-6 h-6 ${activeView === 'explore' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`} />
              <span className={`text-lg font-semibold ${activeView === 'explore' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`}>Courts</span>
            </button>

            {user && (
              <>
                <button
                  onClick={() => setActiveView('notifications')}
                  className={`flex items-center gap-4 px-4 py-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group relative ${
                    activeView === 'notifications' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                  }`}
                >
                  <Bell className={`w-6 h-6 ${activeView === 'notifications' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`} />
                  <span className={`text-lg font-semibold ${activeView === 'notifications' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`}>Notifications</span>
                  <span className="absolute top-2.5 left-7 w-2 h-2 bg-emerald-500 rounded-full"></span>
                </button>

                <button
                  onClick={() => setActiveView('messages')}
                  className={`flex items-center gap-4 px-4 py-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group ${
                    activeView === 'messages' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                  }`}
                >
                  <MessageCircle className={`w-6 h-6 ${activeView === 'messages' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`} />
                  <span className={`text-lg font-semibold ${activeView === 'messages' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`}>Messages</span>
                </button>

                <button
                  onClick={() => setActiveView('bookmarks')}
                  className={`flex items-center gap-4 px-4 py-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group ${
                    activeView === 'bookmarks' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                  }`}
                >
                  <Bookmark className={`w-6 h-6 ${activeView === 'bookmarks' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`} />
                  <span className={`text-lg font-semibold ${activeView === 'bookmarks' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`}>Bookmarks</span>
                </button>

                <button
                  onClick={() => onProfileClick?.(user.id)}
                  className="flex items-center gap-4 px-4 py-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group"
                >
                  <User className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                  <span className="text-lg font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Profile</span>
                </button>

                {profile?.role === 'admin' && (
                  <button
                    onClick={() => window.location.href = '/admin'}
                    className="flex items-center gap-4 px-4 py-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group"
                  >
                    <Shield className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                    <span className="text-lg font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Admin</span>
                  </button>
                )}

                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group ${
                    showMoreMenu ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                  }`}
                >
                  <MoreHorizontal className={`w-6 h-6 ${showMoreMenu ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`} />
                  <span className={`text-lg font-semibold ${showMoreMenu ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`}>More</span>
                </button>
              </>
            )}
          </nav>

          {/* Local Clubs */}
          <div className="mt-6 mb-4">
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80">
                <h2 className="font-black text-base text-slate-900 dark:text-white tracking-tight">Local Clubs</h2>
              </div>
              <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                <button className="w-full px-4 py-3 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10 transition-all duration-200 text-left group">
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30 group-hover:shadow-lg group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all duration-200">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">Pickleball Heaven</div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>487 members</span>
                      </div>
                    </div>
                  </div>
                </button>
                <button className="w-full px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50 dark:hover:from-blue-900/10 dark:hover:to-cyan-900/10 transition-all duration-200 text-left group">
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/30 group-hover:shadow-lg group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-200">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">Metro Courts</div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>832 members</span>
                      </div>
                    </div>
                  </div>
                </button>
                <button className="w-full px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-orange-900/10 dark:hover:to-red-900/10 transition-all duration-200 text-left group">
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/30 group-hover:shadow-lg group-hover:shadow-orange-500/40 group-hover:scale-105 transition-all duration-200">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">Windy City Pickleball</div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>1.2K members</span>
                      </div>
                    </div>
                  </div>
                </button>
                <button className="w-full px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 dark:hover:from-purple-900/10 dark:hover:to-pink-900/10 transition-all duration-200 text-left group">
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/30 group-hover:shadow-lg group-hover:shadow-purple-500/40 group-hover:scale-105 transition-all duration-200">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">Lakeshore Athletic</div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>654 members</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Spacer to push content to bottom */}
          <div className="flex-1"></div>

          {/* User Profile */}
          {user && profile && (
            <div className="flex-shrink-0 flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
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
        <div className="w-full max-w-[600px] lg:ml-[275px] border-r border-slate-200/80 dark:border-slate-800/80 min-h-screen bg-white dark:bg-slate-900">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            {activeView !== 'feed' && (
              <div className="pt-6 pb-5 lg:pt-7 lg:pb-6 px-4">
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeView === 'explore' && 'Courts'}
                  {activeView === 'notifications' && 'Notifications'}
                  {activeView === 'messages' && 'Messages'}
                  {activeView === 'bookmarks' && 'Bookmarks'}
                </h1>
              </div>
            )}

            {/* Twitter-style tabs - Only show in feed view */}
            {activeView === 'feed' && (
              <div className="flex border-b border-slate-200 dark:border-slate-800 pt-4">
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
            )}
          </div>

          {/* Content Area */}
          {activeView === 'feed' && (
            <>
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
            </>
          )}

          {/* Courts View */}
          {activeView === 'explore' && (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🎾</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Browse Courts</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Find and book courts at clubs in your area</p>
              <div className="max-w-md mx-auto bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Coming Soon</p>
              </div>
            </div>
          )}

          {/* Notifications View */}
          {activeView === 'notifications' && user && (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Stay Updated</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Get notified about match invites, event updates, and social interactions</p>
              <div className="max-w-md mx-auto bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Coming Soon</p>
              </div>
            </div>
          )}

          {/* Messages View */}
          {activeView === 'messages' && user && (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Your Messages</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Chat with players, coordinate matches, and stay connected</p>
              <div className="max-w-md mx-auto bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Coming Soon</p>
              </div>
            </div>
          )}

          {/* Bookmarks View */}
          {activeView === 'bookmarks' && user && (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🔖</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Saved Posts</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">View all the posts you've bookmarked for later</p>
              <div className="max-w-md mx-auto bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">No bookmarks yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Trending & Suggestions */}
        <div className="hidden xl:block w-[350px] flex-shrink-0">
          <div className="sticky top-4 space-y-6 pl-8 pr-4 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
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

            {/* Footer Links */}
            <div className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 space-x-3">
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms</a>
              <span>·</span>
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy</a>
              <span>·</span>
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Help</a>
              <div className="mt-2 font-semibold">© 2025 PaddleGrid</div>
            </div>

            {/* Post Button */}
            {user && (
              <div className="px-4 mt-4 pb-6">
                <button
                  onClick={onCreatePost}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-bold text-base shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Post</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* More Menu Modal */}
      {showMoreMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="fixed left-[max(20px,calc((100vw-1280px)/2+20px))] top-1/2 -translate-y-1/2 w-[400px] max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-50 border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">Menu</h2>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={() => {
                  setActiveView('feed');
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 text-left group"
              >
                <Home className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">Feed</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">View your social feed</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveView('explore');
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 text-left group"
              >
                <Building2 className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">Courts</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Browse all courts</div>
                </div>
              </button>

              {user && (
                <>
                  <button
                    onClick={() => {
                      onProfileClick?.(user.id);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 text-left group"
                  >
                    <User className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">Profile</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">View your profile</div>
                    </div>
                  </button>

                  {profile?.role === 'admin' && (
                    <button
                      onClick={() => {
                        window.location.href = '/admin';
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 text-left group"
                    >
                      <Shield className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                      <div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">Admin</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Manage facility</div>
                      </div>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 py-2">
              <div className="px-6 py-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Clubs Near You</h3>
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

            {/* Footer Links in Modal */}
            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium text-slate-500 dark:text-slate-400 space-x-3">
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms</a>
              <span>·</span>
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy</a>
              <span>·</span>
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Help</a>
              <div className="mt-2 font-semibold">© 2025 PaddleGrid</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
