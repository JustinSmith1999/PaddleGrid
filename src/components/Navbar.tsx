import { useState, useEffect } from 'react';
import { User, LogOut, Shield, CalendarRange, Users as UsersIcon, Bell, Search, Calendar, Clock, Gift } from 'lucide-react';
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
    <nav className="bg-green-800/80 backdrop-blur-md shadow-md sticky top-0 z-40 border-b border-green-700/50">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleViewChange('community')}
              className="group flex-shrink-0 flex items-center space-x-3"
            >
              <img
                src="/untitled_design__2_-removebg-preview.png"
                alt="PaddleGrid Logo"
                className="h-10 w-auto group-hover:scale-105 transition-transform duration-300"
              />
            </button>
            {!user && (
              <div className="hidden sm:flex items-center gap-2 bg-green-700/30 rounded-full p-1">
                <button
                  onClick={() => {
                    setAudienceType('players');
                    handleViewChange('community');
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    audienceType === 'players'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  Social
                </button>
                <button
                  onClick={() => {
                    setAudienceType('facilities');
                    handleViewChange('sales');
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    audienceType === 'facilities'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  Facilities Manager
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 rounded-xl bg-green-700/50 hover:bg-blue-600/30 text-emerald-300 hover:text-blue-300 transition-all"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <div className="relative" data-profile-menu>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                    {profile?.profile_picture_url ? (
                      <img
                        src={profile.profile_picture_url}
                        alt={profile.full_name || 'Profile'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/20 hover:border-white/40 transition-all"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-700/50 hover:bg-green-600/50 flex items-center justify-center border-2 border-white/20 hover:border-white/40 transition-all">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleViewChange('profile');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleViewChange('partners');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <UsersIcon className="w-4 h-4" />
                        Find Partners
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleViewChange('waitlist');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Waitlist
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleViewChange('rewards');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Gift className="w-4 h-4" />
                        Rewards
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          signOut();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all"
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
