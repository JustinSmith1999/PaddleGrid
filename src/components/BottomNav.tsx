import { Home, Search, Calendar, User, Shield, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

type ViewType = 'home' | 'browse' | 'bookings' | 'profile' | 'admin' | 'series' | 'my-series' | 'community' | 'trending' | 'discover';

interface BottomNavProps {
  onViewChange: (view: ViewType) => void;
}

export function BottomNav({ onViewChange }: BottomNavProps) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const getCurrentView = (): ViewType => {
    const path = location.pathname;
    if (path === '/') return 'community';
    if (path.startsWith('/browse')) return 'browse';
    if (path.startsWith('/club/')) return 'browse';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/discover')) return 'discover';
    if (path.startsWith('/player/')) return 'community';
    if (path.startsWith('/post/')) return 'community';
    return 'community';
  };

  const currentView = getCurrentView();

  if (!user) {
    return null;
  }

  const navItems = [
    { view: 'community' as ViewType, icon: Home, label: 'Feed' },
    { view: 'discover' as ViewType, icon: Users, label: 'Players' },
    { view: 'browse' as ViewType, icon: Search, label: 'Courts' },
    { view: 'profile' as ViewType, icon: User, label: 'Profile' },
  ];

  if (isAdmin) {
    navItems.push({ view: 'admin' as ViewType, icon: Shield, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-bottom">
      <div className="flex items-center justify-around max-w-2xl mx-auto">
        {navItems.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-1 transition-all relative ${
              currentView === view
                ? 'text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {currentView === view && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-600 rounded-b-full"></div>
            )}
            <Icon className={`w-6 h-6 mb-1 transition-transform ${currentView === view ? 'scale-110' : ''}`} />
            <span className={`text-xs font-medium ${currentView === view ? 'font-semibold' : ''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
