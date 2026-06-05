import { useState, useEffect } from 'react';
import { User, LogOut, Shield, CalendarRange, Users as UsersIcon, Bell, Search, Calendar, Clock, Gift, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Global navbar always shows — pages should NOT have their own nav

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
    <nav role="navigation" aria-label="Main navigation" className="bg-white sticky top-0 z-40 will-change-transform border-b border-slate-200/60">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-2">
        <div className="flex items-center justify-between h-12 relative">
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleViewChange('community')}
              className="group flex-shrink-0 flex items-center gap-2.5"
            >
              <img
                src="/logo.png"
                alt="PaddleGrid"
                className="hidden sm:block h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </button>

            {/* Mobile-only centered wordmark — exact font + color from the logo */}
            <button
              onClick={() => handleViewChange('community')}
              aria-label="PaddleGrid"
              className="sm:hidden absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-auto"
            >
              <span
                className="text-[15px] font-semibold uppercase select-none"
                style={{
                  fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
                  color: '#16291E',
                  letterSpacing: '0.18em',
                }}
              >
                Paddle&nbsp;Grid
              </span>
            </button>

            {!user && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => {
                    setAudienceType('players');
                    handleViewChange('community');
                  }}
                  className={`px-5 py-2 rounded-lg text-sm transition-all duration-300 ${
                    audienceType === 'players'
                      ? 'bg-white shadow-sm text-green-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Social
                </button>
                <button
                  onClick={() => {
                    setAudienceType('facilities');
                    handleViewChange('sales');
                  }}
                  className={`px-5 py-2 rounded-lg text-sm transition-all duration-300 whitespace-nowrap ${
                    audienceType === 'facilities'
                      ? 'bg-white shadow-sm text-green-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  For Venues
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setShowNotifications(true)}
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                  className="relative p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <div className="relative" data-profile-menu>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    aria-expanded={showProfileMenu}
                    aria-haspopup="true"
                    aria-label="User menu"
                    className="group"
                  >
                    {profile?.profile_picture_url ? (
                      <img
                        src={profile.profile_picture_url}
                        alt={profile.full_name || 'Profile'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 hover:border-green-500 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-700 hover:bg-green-800 flex items-center justify-center border-2 border-slate-200 hover:border-green-500 transition-all duration-300">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50"
                      >
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleViewChange('profile');
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-green-50 flex items-center gap-3 transition-all duration-200 rounded-xl"
                        >
                          <User className="w-4 h-4" />
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleViewChange('partners');
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-green-50 flex items-center gap-3 transition-all duration-200 rounded-xl"
                        >
                          <UsersIcon className="w-4 h-4" />
                          Find Partners
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleViewChange('waitlist');
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-green-50 flex items-center gap-3 transition-all duration-200 rounded-xl"
                        >
                          <Clock className="w-4 h-4" />
                          Waitlist
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            window.location.href = '/merch';
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-green-50 flex items-center gap-3 transition-all duration-200 rounded-xl"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Shop Merch
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleViewChange('rewards');
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-green-50 flex items-center gap-3 transition-all duration-200 rounded-xl"
                        >
                          <Gift className="w-4 h-4" />
                          Rewards
                        </button>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            signOut();
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-all duration-200 rounded-xl"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md"
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
