import { useState, useEffect } from 'react';
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

  return (
    <>
      {/* Hamburger Button - Bottom Left */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-24 left-6 w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg hover:scale-110 z-40"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => handleViewChange('feed')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left ${
                activeView === 'feed'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-lg font-semibold">Feed</span>
            </button>

            <button
              onClick={() => handleViewChange('explore')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left ${
                activeView === 'explore'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-6 h-6" />
              <span className="text-lg font-semibold">Courts</span>
            </button>

            <button
              onClick={() => handleViewChange('search')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left ${
                activeView === 'search'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Search className="w-6 h-6" />
              <span className="text-lg font-semibold">Search</span>
            </button>

            <button
              onClick={handleProfileClick}
              className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <User className="w-6 h-6" />
              <span className="text-lg font-semibold">Profile</span>
            </button>

            {profile?.role === 'admin' && (
              <button
                onClick={() => {
                  window.location.href = '/admin';
                  setIsOpen(false);
                }}
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Shield className="w-6 h-6" />
                <span className="text-lg font-semibold">Admin</span>
              </button>
            )}

            <button
              onClick={handleNotificationsClick}
              className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 relative"
            >
              <Bell className="w-6 h-6" />
              <span className="text-lg font-semibold">Notifications</span>
              {unreadNotifications > 0 && (
                <span className="absolute top-3 left-7 w-2 h-2 bg-emerald-500 rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleViewChange('messages')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left ${
                activeView === 'messages'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-lg font-semibold">Messages</span>
            </button>

            <button
              onClick={() => handleViewChange('bookmarks')}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left ${
                activeView === 'bookmarks'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-6 h-6" />
              <span className="text-lg font-semibold">Bookmarks</span>
            </button>

            {/* Local Clubs */}
            {facilities.length > 0 && (
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="px-4 py-2 text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Local Clubs
                </h3>
                <div className="space-y-1">
                  {facilities.map((facility, index) => {
                    const bgClasses = [
                      'w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm p-1',
                      'w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm p-1',
                      'w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm p-1',
                      'w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm p-1'
                    ];

                    return (
                      <button
                        key={facility.id}
                        onClick={() => handleClubClick(facility.slug)}
                        className="w-full px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 text-left flex items-start gap-3"
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
                            <Building2 className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {facility.name}
                          </div>
                          {facility.city && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
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
      </div>
    </>
  );
}
