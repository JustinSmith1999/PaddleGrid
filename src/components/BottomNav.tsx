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
    { view: 'browse' as ViewType, icon: Search, label: 'Clubs' },
    { view: 'discover' as ViewType, icon: Users, label: 'Search' },
  ];

  if (isAdmin) {
    navItems.push({ view: 'admin' as ViewType, icon: Shield, label: 'Admin' });
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-2xl z-50 safe-area-bottom">
      <div className="flex items-center justify-around max-w-2xl mx-auto">
        {navItems.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`flex-1 flex flex-col items-center justify-center py-3.5 px-1 transition-all duration-300 relative ${
              currentView === view
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {currentView === view && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-b-full shadow-lg"></div>
            )}
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
              currentView === view
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30'
                : 'bg-transparent'
            }`}>
              <Icon className={`w-6 h-6 transition-all duration-300 ${currentView === view ? 'scale-110' : ''}`} />
            </div>
            <span className={`text-xs mt-1 transition-all duration-300 ${currentView === view ? 'font-bold' : 'font-medium'}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
