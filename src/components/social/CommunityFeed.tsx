import { useState, useEffect } from 'react';
import SponsorSlot from '../SponsorSlot';
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
  const [activeTab, setActiveTab] = useState<'for_you' | 'trending' | 'following'>('for_you');
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
        facilityIds: activeTab === 'for_you' ? userFacilityIds : undefined,
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
        <div className="hidden lg:flex w-[240px] xl:w-[260px] flex-shrink-0 flex-col fixed left-[max(0px,calc((100vw-1400px)/2))] top-[56px] max-h-[calc(100vh-3.5rem)] border-r border-slate-200/60 px-3 pb-6 overflow-y-auto pt-3 z-40 bg-white/98 backdrop-blur-sm justify-between">
          <div>
            {/* New Post Button */}
            {user && (
              <motion.button
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreatePost}
                className="w-full py-2.5 px-4 bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 mb-3"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Post</span>
              </motion.button>
            )}

            {/* Primary Navigation */}
            <nav className="space-y-0.5 px-1">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => setActiveView(item.view)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 w-full text-left group ${
                    activeView === item.view
                      ? 'bg-green-50 text-green-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] ${activeView === item.view ? 'text-green-700' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                  <span className={`text-[13px] ${activeView === item.view ? 'font-bold' : 'font-medium'} transition-colors`}>{item.label}</span>
                </button>
              ))}

              <button
                onClick={() => user ? onProfileClick?.(user.id) : null}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-all duration-150 w-full text-left group text-slate-600"
              >
                <User className="w-[18px] h-[18px] text-slate-400 group-hover:text-slate-600 transition-colors" />
                <span className="text-[13px] font-medium group-hover:text-slate-800 transition-colors">Profile</span>
              </button>

              {profile?.role === 'admin' && (
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-all duration-150 w-full text-left group text-slate-600"
                >
                  <Shield className="w-[18px] h-[18px] text-slate-400 group-hover:text-slate-600 transition-colors" />
                  <span className="text-[13px] font-medium group-hover:text-slate-800 transition-colors">Admin</span>
                </button>
              )}
            </nav>

            {/* Divider */}
            {user && <div className="mx-3 my-2 border-t border-slate-100" />}

            {/* Secondary Navigation */}
            {user && (
              <nav className="space-y-0.5 px-1">
                <button
                  onClick={() => setShowNotificationsPanel(true)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-all duration-150 w-full text-left group relative text-slate-600"
                >
                  <Bell className="w-[18px] h-[18px] text-slate-400 group-hover:text-slate-600 transition-colors" />
                  <span className="text-[13px] font-medium group-hover:text-slate-800 transition-colors">Notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="ml-auto min-w-[18px] h-[18px] bg-green-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>
                  )}
                </button>

                <button
                  onClick={() => setActiveView('messages')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 w-full text-left group ${
                    activeView === 'messages' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <MessageCircle className={`w-[18px] h-[18px] ${activeView === 'messages' ? 'text-green-700' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                  <span className={`text-[13px] ${activeView === 'messages' ? 'font-bold' : 'font-medium'} transition-colors`}>Messages</span>
                </button>

                <button
                  onClick={() => setActiveView('bookmarks')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 w-full text-left group ${
                    activeView === 'bookmarks' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Bookmark className={`w-[18px] h-[18px] ${activeView === 'bookmarks' ? 'text-green-700' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                  <span className={`text-[13px] ${activeView === 'bookmarks' ? 'font-bold' : 'font-medium'} transition-colors`}>Bookmarks</span>
                </button>
              </nav>
            )}

            {/* Local Clubs */}
            {facilities.length > 0 && (
              <div className="mt-2">
                <div className="mx-3 mb-1 border-t border-slate-100" />
                <div className="px-4 pt-2 pb-1">
                  <h2 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Your Clubs</h2>
                </div>
                <div className="px-1">
                  {facilities.map((facility) => (
                    <button
                      key={facility.id}
                      onClick={() => onClubClick?.(facility.slug)}
                      className="w-full px-3 py-2 hover:bg-slate-50 rounded-lg transition-all duration-150 text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center flex-shrink-0 p-0.5 overflow-hidden">
                          {facility.logo_url ? (
                            <img
                              src={facility.logo_url}
                              alt={facility.name}
                              className="w-full h-full object-contain rounded"
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
                          <div className="font-semibold text-slate-700 text-[13px] truncate group-hover:text-slate-900 transition-colors">{facility.name}</div>
                          <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            <span>{facility.memberCount}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom: User Profile Card */}
          {user && profile && (
            <div className="mt-auto pt-3">
              <div className="mx-1 border-t border-slate-100 pt-3">
                <button
                  onClick={() => onProfileClick?.(user.id)}
                  className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 transition-all duration-150 text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(profile.first_name?.[0] || '').toUpperCase()}{(profile.last_name?.[0] || '').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-slate-700 truncate">{profile.first_name} {profile.last_name}</div>
                      <div className="text-[11px] text-slate-400 truncate">@{profile.first_name?.toLowerCase()}{profile.last_name?.toLowerCase()}</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Main Feed - Centered with fixed width */}
        <div className={`w-full ${isFullWidthView ? 'max-w-none' : 'max-w-[620px]'} ${shouldShowSidebar ? 'lg:ml-[240px] xl:ml-[260px]' : ''} ${!isFullWidthView && shouldShowSidebar ? 'border-r border-slate-200/60' : ''} min-h-screen bg-[#F8F9FC] relative`}>
          {/* Sticky Header */}
          {activeView !== 'messages' && (
            <div className="sticky top-[56px] z-10 bg-white border-b will-change-transform border-slate-200/60">
              {activeView !== 'feed' && (
                <div className="pt-4 pb-4 lg:pb-5 px-4 flex items-center gap-3">
                  <button
                    onClick={toggleSidebar}
                    className="hidden lg:flex p-2 hover:bg-slate-50 rounded-xl transition-colors"
                    title={sidebarCollapsed ? 'Show menu' : 'Hide menu'}
                  >
                    <Menu className="w-5 h-5 text-slate-500" />
                  </button>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
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
                <div className="flex items-end justify-center gap-2 sm:gap-3 px-3 pt-2.5 pb-3 bg-white border-b border-slate-100">
                  {([
                    { id: 'for_you',  label: 'For You'  },
                    { id: 'trending',  label: 'Trending'  },
                    { id: 'following', label: 'Following' },
                  ] as const).map((t) => {
                    const isActive = activeTab === t.id;
                    return (
                      <motion.button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        whileTap={{ scale: 0.94 }}
                        aria-current={isActive ? 'page' : undefined}
                        className="relative flex items-center justify-center px-3 sm:px-4 py-1.5 min-w-[88px]"
                      >
                        <span
                          className={`text-[13px] tracking-[0.04em] font-bold transition-colors ${
                            isActive ? 'text-[#16291E]' : 'text-[#B5A896] hover:text-[#16291E]/70'
                          }`}
                        >
                          {t.label}
                        </span>
                        {isActive && (
                          <motion.span
                            layoutId="feedTabDot"
                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#16291E]"
                            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
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
                    <div key={post.id}>
                      <motion.div
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
                      {index === 2 && <SponsorSlot location="feed_top" variant="post" />}
                    </div>
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
                      {activeTab === 'for_you' ? '🏢' : activeTab === 'following' ? '👥' : '📣'}
                    </div>
                    <p className="text-slate-800 font-bold text-lg mb-2">
                      {activeTab === 'for_you'
                        ? 'No posts from your clubs yet'
                        : activeTab === 'following'
                        ? 'No posts from followed players'
                        : 'No posts yet'}
                    </p>
                    <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                      {activeTab === 'for_you'
                        ? 'Be the first to share with followers of your clubs!'
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
                    <h2 className="text-lg font-bold text-slate-800 mb-2">No Bookmarks Yet</h2>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                      Save posts you want to revisit later by clicking the bookmark icon
                    </p>
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Notifications Panel — now rendered globally in App.tsx; left here as a no-op */}

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
