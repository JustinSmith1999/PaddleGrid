import { Home, Search, Calendar, User, Shield, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-2xl border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] z-50 safe-area-bottom">
      <div className="flex items-center justify-around max-w-2xl mx-auto px-2 py-1.5">
        {navItems.map(({ view, icon: Icon, label }) => {
          const isActive = currentView === view;

          return (
            <motion.button
              key={view}
              onClick={() => onViewChange(view)}
              whileTap={{ scale: 0.92 }}
              className="relative flex-1 flex flex-col items-center justify-center py-2 px-3 gap-1"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-1 bg-green-50 rounded-2xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <div
                className={`relative z-10 transition-colors duration-200 ${
                  isActive
                    ? 'text-green-700 bg-green-50 rounded-xl p-2'
                    : 'text-slate-400 hover:text-slate-600 p-2'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <span
                className={`relative z-10 transition-colors duration-200 text-[10px] ${
                  isActive
                    ? 'text-green-700 font-bold'
                    : 'text-slate-400 font-medium'
                }`}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
