import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Search, Building2, User, Shield, Bell, MessageCircle, Bookmark, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface MobileMenuProps {
  activeView: string;
  onViewChange: (view: 'feed' | 'explore' | 'search' | 'messages' | 'bookmarks') => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onClubClick?: (slug: string) => void;
  unreadNotifications: number;
}

export default function MobileMenu({
  activeView,
  onViewChange,
  onNotificationsClick,
  onProfileClick,
  onClubClick,
  unreadNotifications
}: MobileMenuProps) {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string; slug: string; logo_url: string | null; city: string | null }>>([]);

  useEffect(() => {
    if (isOpen) {
      fetchFacilities();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  async function fetchFacilities() {
    try {
      const { data: facilitiesData } = await supabase
        .from('facilities')
        .select('id, name, slug, logo_url, city')
        .order('created_at', { ascending: true })
        .limit(4);

      if (facilitiesData) {
        setFacilities(facilitiesData);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  }

  const handleViewChange = (view: 'feed' | 'explore' | 'search' | 'messages' | 'bookmarks') => {
    onViewChange(view);
    setIsOpen(false);
  };

  const handleClubClick = (slug: string) => {
    onClubClick?.(slug);
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    onProfileClick();
    setIsOpen(false);
  };

  const handleNotificationsClick = () => {
    onNotificationsClick();
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  const menuItemBase = 'px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-all duration-200 w-full text-left';
  const menuItemActive = 'bg-green-50 text-green-700 font-bold';

  return (
    <>
      {/* Hamburger Button - Bottom Left */}
      {activeView !== 'messages' && (
        <button
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-label="Open navigation menu"
          className="lg:hidden fixed bottom-24 left-6 w-14 h-14 bg-green-700 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-all shadow-lg hover:scale-110 z-40"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Overlay + Slide-out Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Slide-out Menu Panel */}
            <motion.div
              role="dialog"
              aria-label="Navigation menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 h-full w-[280px] bg-white shadow-2xl z-50"
            >
              <div className="flex flex-col h-full overflow-y-auto">
                {/* Header with Avatar */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full ring-2 ring-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.display_name || 'Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {profile?.display_name || 'Menu'}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close navigation menu"
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                  <button
                    onClick={() => handleViewChange('feed')}
                    className={`${menuItemBase} ${activeView === 'feed' ? menuItemActive : ''}`}
                  >
                    <Home className="w-5 h-5" />
                    <span>Feed</span>
                  </button>

                  <button
                    onClick={() => handleViewChange('explore')}
                    className={`${menuItemBase} ${activeView === 'explore' ? menuItemActive : ''}`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span>Courts</span>
                  </button>

                  <button
                    onClick={() => handleViewChange('search')}
                    className={`${menuItemBase} ${activeView === 'search' ? menuItemActive : ''}`}
                  >
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </button>

                  <button
                    onClick={handleProfileClick}
                    className={menuItemBase}
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </button>

                  {profile?.role === 'admin' && (
                    <button
                      onClick={() => {
                        window.location.href = '/admin';
                        setIsOpen(false);
                      }}
                      className={menuItemBase}
                    >
                      <Shield className="w-5 h-5" />
                      <span>Admin</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-2" />

                  <button
                    onClick={handleNotificationsClick}
                    className={`${menuItemBase} relative`}
                  >
                    <Bell className="w-5 h-5" />
                    <span>Notifications</span>
                    {unreadNotifications > 0 && (
                      <span className="absolute top-3 left-8 w-2 h-2 bg-green-600 rounded-full"></span>
                    )}
                  </button>

                  <button
                    onClick={() => handleViewChange('messages')}
                    className={`${menuItemBase} ${activeView === 'messages' ? menuItemActive : ''}`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Messages</span>
                  </button>

                  <button
                    onClick={() => handleViewChange('bookmarks')}
                    className={`${menuItemBase} ${activeView === 'bookmarks' ? menuItemActive : ''}`}
                  >
                    <Bookmark className="w-5 h-5" />
                    <span>Bookmarks</span>
                  </button>

                  {/* Local Clubs */}
                  {facilities.length > 0 && (
                    <div className="border-t border-slate-100 my-2 pt-2">
                      <h3 className="px-5 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Local Clubs
                      </h3>
                      <div className="space-y-1">
                        {facilities.map((facility, index) => {
                          const bgClasses = [
                            'w-9 h-9 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-sm p-1',
                            'w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm p-1',
                            'w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm p-1',
                            'w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm p-1'
                          ];

                          return (
                            <button
                              key={facility.id}
                              onClick={() => handleClubClick(facility.slug)}
                              className="w-full px-5 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200 text-left flex items-center gap-3"
                            >
                              <div className={bgClasses[index]}>
                                {facility.logo_url ? (
                                  <img
                                    src={facility.logo_url}
                                    alt={facility.name}
                                    className="w-full h-full object-contain rounded"
                                    style={{ mixBlendMode: 'multiply' }}
                                  />
                                ) : (
                                  <Building2 className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-700">
                                  {facility.name}
                                </div>
                                {facility.city && (
                                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {facility.city}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
