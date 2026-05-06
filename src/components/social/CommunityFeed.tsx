import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, TrendingUp, Users, Calendar, MapPin, Building2, Home, Search, Bell, MessageCircle, User, Bookmark, PlusCircle, Shield, Menu, X } from 'lucide-react';
import { SocialPost, getFeedPosts, getNotifications, Notification, getBookmarkedPosts } from '../../lib/socialUtils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import PostCard from './PostCard';
import NotificationsPanel from './NotificationsPanel';
import NotificationsInlineFeed from './NotificationsInlineFeed';
import { BrowseCourts } from '../BrowseCourts';
import Messages from './Messages';
import UserSearch from './UserSearch';
import MobileMenu from '../MobileMenu';
import StoriesHighlights from './StoriesHighlights';
import WhosPlayingNow from './WhosPlayingNow';
import SuggestedPlayers from './SuggestedPlayers';
import WeatherWidget from './WeatherWidget';
import StoryComposer from './StoryComposer';

interface CommunityFeedProps {
  onCreatePost: () => void;
  onPostClick: (postId: string) => void;
  onClubClick?: (facilityId: string) => void;
  onProfileClick?: (userId: string) => void;
  onViewChange?: (view: string) => void;
}

export default function CommunityFeed({ onCreatePost, onPostClick, onClubClick, onProfileClick, onViewChange }: CommunityFeedProps) {
  const { user, profile } = useAuth();
  const [activeView, setActiveView] = useState<'feed' | 'explore' | 'search' | 'notifications' | 'messages' | 'bookmarks' | 'profile'>('feed');
  const [activeTab, setActiveTab] = useState<'my_clubss' | 'following' | 'all_local'>('all_local');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userFacilityIds, setUserFacilityIds] = useState<string[]>([]);
  const [displayCount, setDisplayCount] = useState(25);
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string; slug: string; logo_url: string | null; memberCount: number }>>([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<SocialPost[]>([]);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [storiesKey, setStoriesKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [hideStories, setHideStories] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setHideStories(true);
      } else if (currentScrollY < lastScrollY) {
        setHideStories(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    fetchFacilities();
    if (user) {
      fetchUserFacilities();
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    setDisplayCount(25);
    loadPosts();
  }, [activeTab, userFacilityIds.join(',')]);

  useEffect(() => {
    if (activeView === 'bookmarks' && user) {
      loadBookmarks();
    }
  }, [activeView, user]);

  useEffect(() => {
    onViewChange?.(activeView);
  }, [activeView, onViewChange]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (activeView !== 'feed') {
      setSidebarCollapsed(true);
    } else {
      const saved = localStorage.getItem('sidebarCollapsed');
      setSidebarCollapsed(saved ? JSON.parse(saved) : false);
    }
  }, [activeView]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const isFullWidthView = ['messages', 'explore', 'search', 'notifications', 'bookmarks'].includes(activeView);
  const shouldShowSidebar = activeView === 'feed' || !sidebarCollapsed;

  async function fetchUserFacilities() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('facility_users')
        .select('facility_id')
        .eq('user_id', user.id);

      if (data && data.length > 0) {
        setUserFacilityIds(data.map(f => f.facility_id));
      }
    } catch (error) {
      console.error('Error fetching user facilities:', error);
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
        facilityIds: activeTab === 'my_clubss' ? userFacilityIds : undefined,
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

  async function loadBookmarks() {
    setLoading(true);
    try {
      const bookmarks = await getBookmarkedPosts();
      setBookmarkedPosts(bookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { view: 'feed' as const, icon: Home, label: 'Feed' },
    { view: 'explore' as const, icon: Building2, label: 'Courts' },
    { view: 'search' as const, icon: Search, label: 'Search' },
  ];

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-7 h-7 text-green-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] relative">
      {/* Background Pattern - Desktop Only */}
      <div
        className="hidden lg:block fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/whie_pickleball.webp)',
          backgroundSize: '400px',
          backgroundRepeat: 'repeat',
          filter: 'grayscale(100%)',
          opacity: 0.04
        }}
      />
      <div className="flex justify-center w-full relative z-10 min-h-screen">
        {/* Left Sidebar Navigation */}
        {shouldShowSidebar && (
        <div className="hidden lg:flex w-[240px] xl:w-[260px] flex-shrink-0 flex-col fixed left-[max(0px,calc((100vw-1400px)/2))] top-[56px] max-h-[calc(100vh-3.5rem)] border-r border-slate-200/60 px-4 pb-6 overflow-y-auto pt-4 z-40 bg-white/98 backdrop-blur-sm">
            {/* Navigation Links */}
            <nav className="space-y-0.5 pt-2 pb-2 px-2">
            {navItems.map((item, index) => (
              <motion.div
                key={item.view}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.25 }}
              >
                <button
                  onClick={() => setActiveView(item.view)}
                  className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-200 w-full text-left group ${
                    activeView === item.view ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-700'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${activeView === item.view ? 'text-green-700' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                  <span className={`text-sm ${activeView === item.view ? 'font-bold text-green-700' : 'font-semibold text-slate-500 group-hover:text-slate-700'} transition-colors`}>{item.label}</span>
                </button>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.25 }}
            >
              <button
                onClick={() => user ? onProfileClick?.(user.id) : null}
                className="flex items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-slate-50/50 hover:text-slate-700 transition-all duration-200 w-full text-left group text-slate-500"
              >
                <User className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">Profile</span>
              </button>
            </motion.div>

            {profile?.role === 'admin' && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.25 }}
              >
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="flex items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-slate-50/50 hover:text-slate-700 transition-all duration-200 w-full text-left group text-slate-500"
                >
                  <Shield className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">Admin</span>
                </button>
              </motion.div>
            )}

            {user && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.25 }}
                >
                  <button
                    onClick={() => setShowNotificationsPanel(true)}
                    className="flex items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-slate-50/50 hover:text-slate-700 transition-all duration-200 w-full text-left group relative text-slate-500"
                  >
                    <Bell className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">Notifications</span>
                    {unreadNotifications > 0 && (
                      <span className="absolute top-2 left-7 w-2 h-2 bg-green-700 rounded-full"></span>
                    )}
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.25 }}
                >
                  <button
                    onClick={() => setActiveView('messages')}
                    className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-200 w-full text-left group ${
                      activeView === 'messages' ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-700'
                    }`}
                  >
                    <MessageCircle className={`w-5 h-5 ${activeView === 'messages' ? 'text-green-700' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                    <span className={`text-sm ${activeView === 'messages' ? 'font-bold text-green-700' : 'font-semibold text-slate-500 group-hover:text-slate-700'} transition-colors`}>Messages</span>
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35, duration: 0.25 }}
                >
                  <button
                    onClick={() => setActiveView('bookmarks')}
                    className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-200 w-full text-left group ${
                      activeView === 'bookmarks' ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-700'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${activeView === 'bookmarks' ? 'text-green-700' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                    <span className={`text-sm ${activeView === 'bookmarks' ? 'font-bold text-green-700' : 'font-semibold text-slate-500 group-hover:text-slate-700'} transition-colors`}>Bookmarks</span>
                  </button>
                </motion.div>
              </>
            )}
          </nav>

          {/* Local Clubs */}
          <div className="mt-3 mb-2">
            <div>
              <div className="px-6 py-3 border-t border-slate-200/60">
                <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase" style={{ fontFamily: 'Manrope, sans-serif' }}>Local Clubs</h2>
              </div>
              <div className="px-2">
                {facilities.map((facility, index) => (
                  <motion.div
                    key={facility.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.25 }}
                  >
                    <button
                      onClick={() => onClubClick?.(facility.slug)}
                      className="w-full px-4 py-2.5 hover:bg-slate-50/50 rounded-xl transition-all duration-200 text-left group"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center flex-shrink-0 p-1">
                          {facility.logo_url ? (
                            <img
                              src={facility.logo_url}
                              alt={facility.name}
                              className="w-full h-full object-contain rounded-lg"
                              style={{ mixBlendMode: 'multiply' }}
                            />
                          ) : (
                            <img
                              src="/logo.png"
                              alt={facility.name}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>{facility.name}</div>
                          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{facility.memberCount} {facility.memberCount === 1 ? 'member' : 'members'}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Main Feed - Centered with fixed width */}
        <div className={`w-full ${isFullWidthView ? 'max-w-none' : 'max-w-[620px]'} ${shouldShowSidebar ? 'lg:ml-[240px] xl:ml-[260px]' : ''} ${!isFullWidthView && shouldShowSidebar ? 'border-r border-slate-200/60' : ''} min-h-screen bg-[#F8F9FC] relative`}>
          {/* Sticky Header */}
          {activeView !== 'messages' && (
            <div className="sticky top-[56px] z-10 bg-white/98 backdrop-blur-xl border-b border-slate-200/60">
              {activeView !== 'feed' && (
                <div className="pt-4 pb-4 lg:pb-5 px-4 flex items-center gap-3">
                  <button
                    onClick={toggleSidebar}
                    className="hidden lg:flex p-2 hover:bg-slate-50 rounded-xl transition-colors"
                    title={sidebarCollapsed ? 'Show menu' : 'Hide menu'}
                  >
                    <Menu className="w-5 h-5 text-slate-500" />
                  </button>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {activeView === 'explore' && 'Courts'}
                    {activeView === 'search' && 'Search Players'}
                    {activeView === 'notifications' && 'Notifications'}
                    {activeView === 'bookmarks' && 'Bookmarks'}
                  </h1>
                </div>
              )}

            {/* Feed Tabs */}
            {activeView === 'feed' && (
              <>
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('all_local')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold hover:bg-slate-50/50 transition-all duration-200 relative ${
                      activeTab === 'all_local'
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    For You
                    {activeTab === 'all_local' && (
                      <motion.div layoutId="feedTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700 rounded-full" />
                    )}
                  </button>

                  {user && userFacilityIds.length > 0 && (
                    <button
                      onClick={() => setActiveTab('my_clubs')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold hover:bg-slate-50/50 transition-all duration-200 relative ${
                        activeTab === 'my_clubs'
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      My Clubs
                      {activeTab === 'my_clubs' && (
                        <motion.div layoutId="feedTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700 rounded-full" />
                      )}
                    </button>
                  )}

                  {user && (
                    <button
                      onClick={() => setActiveTab('following')}
                      className={`flex-1 px-4 py-3 text-sm font-semibold hover:bg-slate-50/50 transition-all duration-200 relative ${
                        activeTab === 'following'
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      Following
                      {activeTab === 'following' && (
                        <motion.div layoutId="feedTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700 rounded-full" />
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          )}

          {/* Stories Highlights - Only in feed view */}
          {activeView === 'feed' && (
            <div
              className={`transition-all duration-300 ease-in-out ${
                hideStories
                  ? 'max-h-0 opacity-0 -translate-y-4'
                  : 'max-h-[200px] opacity-100 translate-y-0'
              } overflow-hidden`}
            >
              <StoriesHighlights
                key={storiesKey}
                onStoryClick={(id, type) => {
                  if (type === 'facility') {
                    onClubClick?.(id);
                  } else {
                    onProfileClick?.(id);
                  }
                }}
                onCreateStory={() => setShowStoryComposer(true)}
              />
            </div>
          )}

          {/* Content Area */}
          {activeView === 'feed' && (
            <>
              {/* Posts Feed */}
              {posts.length > 0 ? (
                <div className="pt-3 px-0 lg:px-0">
                  {posts.slice(0, displayCount).map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      <PostCard
                        post={post}
                        onClick={() => onPostClick(post.id)}
                        onUpdate={() => loadPosts(true)}
                        onClubClick={onClubClick}
                        onProfileClick={onProfileClick}
                      />
                    </motion.div>
                  ))}

                  {displayCount < posts.length && (
                    <div className="px-3 py-4">
                      <button
                        onClick={() => setDisplayCount(prev => Math.min(prev + 25, posts.length))}
                        className="w-full py-3 text-green-700 hover:bg-white rounded-xl font-semibold transition-all duration-200 text-sm border border-slate-200/60 bg-white/50"
                      >
                        Show more posts
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-center py-16 px-6"
                  >
                    <div className="text-5xl mb-4">
                      {activeTab === 'my_clubs' ? '🏢' : activeTab === 'following' ? '👥' : '📣'}
                    </div>
                    <p className="text-slate-800 font-bold text-lg mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {activeTab === 'my_clubs'
                        ? 'No posts from your clubs yet'
                        : activeTab === 'following'
                        ? 'No posts from followed players'
                        : 'No posts yet'}
                    </p>
                    <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                      {activeTab === 'my_clubs'
                        ? 'Be the first to share with members of your clubs!'
                        : activeTab === 'following'
                        ? 'Follow some players to see their posts here. Visit player profiles and click Follow.'
                        : user
                        ? 'Discover posts from all clubs and players in your area'
                        : 'Sign in to create posts and join the conversation'}
                    </p>
                    {user && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCreatePost}
                        className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm text-sm"
                      >
                        Create Post
                      </motion.button>
                    )}
                  </motion.div>
                </div>
              )}
            </>
          )}

          {/* Courts View */}
          {activeView === 'explore' && (
            <div className="p-6">
              <BrowseCourts />
            </div>
          )}

          {/* Search View */}
          {activeView === 'search' && (
            <UserSearch onProfileClick={onProfileClick} />
          )}

          {/* Notifications View */}
          {activeView === 'notifications' && user && (
            <NotificationsInlineFeed onPostClick={onPostClick} onProfileClick={onProfileClick} />
          )}

          {/* Messages View */}
          {activeView === 'messages' && user && (
            <div className="fixed inset-0 top-[56px] pb-20 lg:pb-0">
              <Messages
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={toggleSidebar}
              />
            </div>
          )}

          {/* Bookmarks View */}
          {activeView === 'bookmarks' && user && (
            <>
              {bookmarkedPosts.length > 0 ? (
                <div className="pt-3">
                  {bookmarkedPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.2 }}
                    >
                      <PostCard
                        post={post}
                        onClick={() => onPostClick(post.id)}
                        onUpdate={() => loadBookmarks()}
                        onClubClick={onClubClick}
                        onProfileClick={onProfileClick}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-center py-16 px-6"
                  >
                    <div className="w-16 h-16 bg-[#F8F9FC] rounded-2xl border border-slate-200/60 flex items-center justify-center mx-auto mb-4">
                      <Bookmark className="w-7 h-7 text-slate-300" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>No Bookmarks Yet</h2>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                      Save posts you want to revisit later by clicking the bookmark icon
                    </p>
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar - Trending & Suggestions */}
        {activeView === 'feed' && (
        <div className="hidden xl:block w-[320px] flex-shrink-0">
          <div className="fixed right-[max(16px,calc((100vw-1400px)/2))] top-[56px] w-[300px] space-y-4 max-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pt-4">
            {/* Weather Widget */}
            <WeatherWidget />

            {/* Who's Playing Now */}
            <WhosPlayingNow onFacilityClick={onClubClick} />

            {/* Suggested Players */}
            {user && <SuggestedPlayers onProfileClick={onProfileClick} />}

            {/* Trending Topics */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-4 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>Trending</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { icon: TrendingUp, label: 'Pickleball · Trending', title: 'DUPR Ratings', count: '3.8K posts' },
                  { icon: Calendar, label: 'Events · This Week', title: 'Weekend Tournaments', count: '1.4K posts' },
                  { icon: Building2, label: 'Local · Popular', title: 'New Courts Opening', count: '2.1K posts' },
                  { icon: TrendingUp, label: 'Equipment · Trending', title: 'Best Paddles 2025', count: '987 posts' },
                  { icon: Users, label: 'Community · Growing', title: 'Social Mixers', count: '1.8K posts' },
                  { icon: TrendingUp, label: 'Strategy · Hot', title: 'Third Shot Drop Tips', count: '1.5K posts' },
                ].map((item, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ x: 2 }}
                    className="w-full hover:bg-slate-50/50 transition-all duration-200 px-4 py-3 text-left group"
                  >
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-1 group-hover:text-green-700 transition-colors">
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mb-0.5" style={{ fontFamily: 'Manrope, sans-serif' }}>{item.title}</div>
                    <div className="text-[11px] text-slate-400">{item.count}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Post Button */}
            {user && (
              <div className="px-4 mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCreatePost}
                  className="w-full py-3 px-6 bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Post</span>
                </motion.button>
              </div>
            )}

            {/* Footer Links */}
            <div className="px-4 py-4 pb-6">
              <div className="bg-white rounded-xl border border-slate-200/60 px-4 py-4 text-center">
                <div className="text-xs font-medium text-slate-400 mb-2">
                  <a href="#" className="hover:text-green-700 transition-colors">Terms</a>
                  <span className="mx-1.5 text-slate-300">&middot;</span>
                  <a href="#" className="hover:text-green-700 transition-colors">Privacy</a>
                  <span className="mx-1.5 text-slate-300">&middot;</span>
                  <a href="#" className="hover:text-green-700 transition-colors">Help</a>
                </div>
                <div className="text-xs font-semibold text-slate-500">&copy; 2026 PaddleGrid</div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        activeView={activeView}
        onViewChange={(view) => setActiveView(view)}
        onNotificationsClick={() => setShowNotificationsPanel(true)}
        onProfileClick={() => onProfileClick?.(user?.id || '')}
        onClubClick={onClubClick}
        unreadNotifications={unreadNotifications}
      />

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

      {/* Story Composer */}
      {showStoryComposer && (
        <StoryComposer
          onClose={() => setShowStoryComposer(false)}
          onSuccess={() => {
            setShowStoryComposer(false);
            setStoriesKey(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
