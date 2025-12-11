import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Users, Calendar, MapPin, Building2, Home, Search, Bell, MessageCircle, User, Bookmark, PlusCircle, Shield } from 'lucide-react';
import { SocialPost, getFeedPosts, getNotifications, Notification } from '../../lib/socialUtils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import PostCard from './PostCard';
import NotificationsPanel from './NotificationsPanel';

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
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string; slug: string; logo_url: string | null; memberCount: number }>>([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchFacilities();
    if (user) {
      fetchUserFacility();
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
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

  async function fetchUnreadCount() {
    if (!user) return;
    try {
      const notifications = await getNotifications(50);
      const unreadCount = notifications.filter(n => !n.is_read).length;
      setUnreadNotifications(unreadCount);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  }

  async function fetchFacilities() {
    try {
      const { data: facilitiesData, error } = await supabase
        .from('facilities')
        .select('id, name, slug, logo_url')
        .order('created_at', { ascending: true })
        .limit(4);

      if (error) throw error;

      if (facilitiesData) {
        const facilitiesWithCounts = await Promise.all(
          facilitiesData.map(async (facility) => {
            const { count } = await supabase
              .from('facility_users')
              .select('*', { count: 'exact', head: true })
              .eq('facility_id', facility.id);

            return {
              ...facility,
              memberCount: count || 0
            };
          })
        );

        setFacilities(facilitiesWithCounts);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
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
      <div className="flex justify-center w-full relative z-10 min-h-screen">
        {/* Main Feed - Centered with fixed width */}
        <div className="w-full max-w-[600px] border-r border-slate-200/80 dark:border-slate-800/80 min-h-screen bg-white dark:bg-slate-900">
          {/* Sticky Header */}
          <div className="sticky top-[56px] z-10 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            {activeView !== 'feed' && (
              <div className="pt-6 pb-5 lg:pb-6 px-4">
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeView === 'explore' && 'Courts'}
                  {activeView === 'messages' && 'Messages'}
                  {activeView === 'bookmarks' && 'Bookmarks'}
                </h1>
              </div>
            )}

            {/* Twitter-style tabs - Only show in feed view */}
            {activeView === 'feed' && (
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
          <div className="fixed right-[max(0px,calc((100vw-1280px)/2))] top-[56px] w-[350px] space-y-6 pl-8 pr-4 max-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent pt-6">
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

            {/* Post Button */}
            {user && (
              <div className="px-4 mt-4">
                <button
                  onClick={onCreatePost}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-bold text-base shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Post</span>
                </button>
              </div>
            )}

            {/* Footer Links */}
            <div className="px-4 py-4 pb-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 px-4 py-4 text-center shadow-sm">
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms</a>
                  <span className="mx-1.5">·</span>
                  <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy</a>
                  <span className="mx-1.5">·</span>
                  <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Help</a>
                </div>
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">© 2025 PaddleGrid</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotificationsPanel && (
        <NotificationsPanel
          onClose={() => {
            setShowNotificationsPanel(false);
            fetchUnreadCount();
          }}
          onNotificationClick={(notification) => {
            if (notification.type === 'like' || notification.type === 'comment') {
              if (notification.data.post_id) {
                onPostClick(notification.data.post_id);
              }
            } else if (notification.type === 'follow') {
              if (notification.data.actor_id) {
                onProfileClick?.(notification.data.actor_id);
              }
            }
          }}
        />
      )}
    </div>
  );
}
