import { useState, useEffect } from 'react';
import { User, LogOut, Shield, CalendarRange, Users as UsersIcon, Bell, Search, Calendar, Clock, Gift, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadNotificationCount } from '../lib/socialUtils';
import NotificationsPanel from './social/NotificationsPanel';
import { useLocation } from 'react-router-dom';

type ViewType = 'home' | 'browse' | 'bookings' | 'profile' | 'admin' | 'series' | 'my-series' | 'community' | 'trending' | 'discover' | 'sales';

interface NavbarProps {
  onAuthClick: () => void;
  onViewChange: (view: ViewType) => void;
}

export function Navbar({ onAuthClick, onViewChange }: NavbarProps) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [audienceType, setAudienceType] = useState<'players' | 'facilities'>(
    location.pathname === '/sales' ? 'facilities' : 'players'
  );

  // Hide navbar on homepage when not logged in
  if (!user && location.pathname === '/') {
    return null;
  }

  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
  };

  useEffect(() => {
    setAudienceType(location.pathname === '/sales' ? 'facilities' : 'players');
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-profile-menu]')) {
        setShowProfileMenu(false);
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);

  async function loadUnreadCount() {
    const count = await getUnreadNotificationCount();
    setUnreadCount(count);
  }

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl shadow-2xl sticky top-0 z-40 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleViewChange('community')}
              className="group flex-shrink-0 flex items-center space-x-3"
            >
              <img
                src="/untitled_design__2_-removebg-preview.png"
                alt="PaddleGrid Logo"
                className="h-12 w-auto group-hover:scale-110 transition-all duration-300 drop-shadow-lg"
              />
            </button>
            {!user && (
              <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/10">
                <button
                  onClick={() => {
                    setAudienceType('players');
                    handleViewChange('community');
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    audienceType === 'players'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Social
                </button>
                <button
                  onClick={() => {
                    setAudienceType('facilities');
                    handleViewChange('sales');
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                    audienceType === 'facilities'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Facilities Manager
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/20"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <div className="relative" data-profile-menu>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="group"
                  >
                    {profile?.profile_picture_url ? (
                      <img
                        src={profile.profile_picture_url}
                        alt={profile.full_name || 'Profile'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/30 group-hover:border-emerald-400 transition-all duration-300 shadow-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center border-2 border-white/30 group-hover:border-white/50 transition-all duration-300 shadow-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 backdrop-blur-xl">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleViewChange('profile');
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                      >
                        <User className="w-4 h-4" />
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleViewChange('partners');
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                      >
                        <UsersIcon className="w-4 h-4" />
                        Find Partners
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleViewChange('waitlist');
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                      >
                        <Clock className="w-4 h-4" />
                        Waitlist
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          window.location.href = '/merch';
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Shop Merch
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleViewChange('rewards');
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                      >
                        <Gift className="w-4 h-4" />
                        Rewards
                      </button>
                      <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          signOut();
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {showNotifications && (
        <NotificationsPanel
          onClose={() => {
            setShowNotifications(false);
            loadUnreadCount();
          }}
          onNotificationClick={(notification) => {
            setShowNotifications(false);
            if (notification.data.post_id) {
              handleViewChange('community');
            }
          }}
        />
      )}
    </nav>
  );
}
