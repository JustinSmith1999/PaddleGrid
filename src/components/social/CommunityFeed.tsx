import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Users, Calendar, MapPin, Building2, Home, Search, Bell, MessageCircle, User, Bookmark, PlusCircle, Shield } from 'lucide-react';
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
}

export default function CommunityFeed({ onCreatePost, onPostClick, onClubClick, onProfileClick }: CommunityFeedProps) {
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
        {/* Left Sidebar Navigation */}
        <div className="hidden lg:flex w-[275px] flex-shrink-0 flex-col fixed left-[max(0px,calc((100vw-1280px)/2))] top-[56px] max-h-[calc(100vh-3.5rem)] border-r border-slate-200/80 dark:border-slate-800/80 px-6 pb-6 overflow-y-auto pt-6">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40">
            {/* Navigation Links */}
            <nav className="space-y-1 pt-2 pb-2 px-2">
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

            <button
              onClick={() => setActiveView('search')}
              className={`flex items-center gap-4 px-4 py-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group ${
                activeView === 'search' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
              }`}
            >
              <Search className={`w-6 h-6 ${activeView === 'search' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`} />
              <span className={`text-lg font-semibold ${activeView === 'search' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`}>Search</span>
            </button>

            <button
              onClick={() => user ? onProfileClick?.(user.id) : null}
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

            {user && (
              <>
                <button
                  onClick={() => setShowNotificationsPanel(true)}
                  className="flex items-center gap-4 px-4 py-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 w-full text-left group relative"
                >
                  <Bell className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                  <span className="text-lg font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="absolute top-2.5 left-7 w-2 h-2 bg-emerald-500 rounded-full"></span>
                  )}
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
              </>
            )}
          </nav>

          {/* Local Clubs */}
          <div className="mt-2 mb-2">
            <div>
              <div className="px-6 py-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <h2 className="font-black text-base text-slate-900 dark:text-white tracking-tight">Local Clubs</h2>
              </div>
              <div>
                {facilities.map((facility, index) => {
                  const buttonClasses = [
                    'w-full px-6 py-4 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10 transition-all duration-200 text-left group',
                    'w-full px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50 dark:hover:from-blue-900/10 dark:hover:to-cyan-900/10 transition-all duration-200 text-left group',
                    'w-full px-6 py-4 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-orange-900/10 dark:hover:to-red-900/10 transition-all duration-200 text-left group',
                    'w-full px-6 py-4 hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-slate-50/50 dark:hover:from-slate-900/10 dark:hover:to-slate-900/10 transition-all duration-200 text-left group'
                  ];

                  const bgClasses = [
                    'w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30 group-hover:shadow-lg group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all duration-200 p-1',
                    'w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/30 group-hover:shadow-lg group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-200 p-1',
                    'w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/30 group-hover:shadow-lg group-hover:shadow-orange-500/40 group-hover:scale-105 transition-all duration-200 p-1',
                    'w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-slate-500/30 group-hover:shadow-lg group-hover:shadow-slate-500/40 group-hover:scale-105 transition-all duration-200 p-1'
                  ];

                  return (
                    <button
                      key={facility.id}
                      onClick={() => onClubClick?.(facility.slug)}
                      className={buttonClasses[index]}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={bgClasses[index]}>
                          {facility.logo_url ? (
                            <img
                              src={facility.logo_url}
                              alt={facility.name}
                              className="w-full h-full object-contain rounded-lg"
                              style={{ mixBlendMode: 'multiply' }}
                            />
                          ) : (
                            <img
                              src="/untitled_design__2_-removebg-preview.png"
                              alt={facility.name}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">{facility.name}</div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{facility.memberCount} {facility.memberCount === 1 ? 'member' : 'members'}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Main Feed - Centered with fixed width */}
        <div className="w-full max-w-[600px] lg:ml-[275px] border-r border-slate-200/80 dark:border-slate-800/80 min-h-screen bg-white dark:bg-slate-900">
          {/* Sticky Header */}
          <div className="sticky top-[56px] z-10 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            {activeView !== 'feed' && (
              <div className="pt-6 pb-5 lg:pb-6 px-4">
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeView === 'explore' && 'Courts'}
                  {activeView === 'search' && 'Search Players'}
                  {activeView === 'notifications' && 'Notifications'}
                  {activeView === 'messages' && 'Messages'}
                  {activeView === 'bookmarks' && 'Bookmarks'}
                </h1>
              </div>
            )}

            {/* Twitter-style tabs - Only show in feed view */}
            {activeView === 'feed' && (
              <>
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab('all_local')}
                    className={`flex-1 px-4 py-2.5 text-[15px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative ${
                      activeTab === 'all_local'
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    For You
                    {activeTab === 'all_local' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                    )}
                  </button>

                  {user && userFacilityIds.length > 0 && (
                    <button
                      onClick={() => setActiveTab('my_clubs')}
                      className={`flex-1 px-4 py-2.5 text-[15px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative ${
                        activeTab === 'my_clubs'
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      My Clubs
                      {activeTab === 'my_clubs' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                      )}
                    </button>
                  )}

                  {user && (
                    <button
                      onClick={() => setActiveTab('following')}
                      className={`flex-1 px-4 py-2.5 text-[15px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative ${
                        activeTab === 'following'
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Following
                      {activeTab === 'following' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Stories Highlights - Only in feed view */}
          {activeView === 'feed' && (
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
          )}

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
                  <div className="text-6xl mb-4">
                    {activeTab === 'my_clubs' ? '🏢' : activeTab === 'following' ? '👥' : '📣'}
                  </div>
                  <p className="text-slate-900 dark:text-white font-semibold text-lg mb-2">
                    {activeTab === 'my_clubs'
                      ? 'No posts from your clubs yet'
                      : activeTab === 'following'
                      ? 'No posts from followed players'
                      : 'No posts yet'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    {activeTab === 'my_clubs'
                      ? 'Be the first to share with members of your clubs!'
                      : activeTab === 'following'
                      ? 'Follow some players to see their posts here. Visit player profiles and click Follow.'
                      : user
                      ? 'Discover posts from all clubs and players in your area'
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
            <Messages />
          )}

          {/* Bookmarks View */}
          {activeView === 'bookmarks' && user && (
            <>
              {bookmarkedPosts.length > 0 ? (
                bookmarkedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => onPostClick(post.id)}
                    onUpdate={() => loadBookmarks()}
                    onClubClick={onClubClick}
                    onProfileClick={onProfileClick}
                  />
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">🔖</div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No Bookmarks Yet</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Save posts you want to revisit later by clicking the bookmark icon
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar - Trending & Suggestions */}
        <div className="hidden xl:block w-[350px] flex-shrink-0">
          <div className="fixed right-[max(0px,calc((100vw-1280px)/2))] top-[56px] w-[350px] space-y-6 pl-8 pr-4 max-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent pt-6">
            {/* Weather Widget */}
            <WeatherWidget />

            {/* Who's Playing Now */}
            <WhosPlayingNow onFacilityClick={onClubClick} />

            {/* Suggested Players */}
            {user && <SuggestedPlayers onProfileClick={onProfileClick} />}

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
