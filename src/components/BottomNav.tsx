import { Home, Calendar, Users, User, ShoppingBag, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

type ViewType =
  | 'home'
  | 'play'
  | 'community'
  | 'me'
  | 'shop'
  | 'admin'
  // Legacy view types kept for backward compat with handleViewChange in App.tsx
  | 'browse' | 'bookings' | 'profile' | 'series' | 'my-series' | 'discover' | 'messages'
  | 'trending' | 'waitlist' | 'partners' | 'rewards';

interface BottomNavProps {
  onViewChange: (view: ViewType) => void;
}

/**
 * Five-destination bottom nav. Everything in the app reaches one of these:
 *   • Home      → the feed + stories
 *   • Play      → courts, bookings, events, series
 *   • Community → messages, discover, partner finder
 *   • Me        → profile, achievements, rewards, waitlist
 *   • Shop      → merch + pro shop
 * Admins see a sixth "Admin" tile when applicable.
 */
export function BottomNav({ onViewChange }: BottomNavProps) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const getCurrentView = (): ViewType => {
    const p = location.pathname;
    if (p.startsWith('/admin')) return 'admin';
    if (p.startsWith('/browse') || p.startsWith('/bookings') || p.startsWith('/series') || p.startsWith('/events') || p.startsWith('/waitlist') || p.startsWith('/club/')) return 'play';
    if (p.startsWith('/messages') || p.startsWith('/discover') || p.startsWith('/partners') || p.startsWith('/player/')) return 'community';
    if (p.startsWith('/profile') || p.startsWith('/rewards') || p.startsWith('/my-series') || p.startsWith('/account')) return 'me';
    if (p.startsWith('/merch') || p.startsWith('/shop')) return 'shop';
    return 'home';
  };

  const currentView = getCurrentView();

  if (!user) return null;

  // Map each top-level destination to its canonical sub-route
  const handleClick = (view: ViewType) => {
    switch (view) {
      case 'home':      onViewChange('community'); break; // home = feed
      case 'play':      onViewChange('browse'); break;
      case 'community': onViewChange('messages'); break;
      case 'me':        onViewChange('profile'); break;
      case 'shop':      onViewChange('browse'); break; // until shop route lands; reuse browse
      case 'admin':     onViewChange('admin'); break;
      default:          onViewChange(view);
    }
  };

  const navItems: { view: ViewType; icon: any; label: string }[] = [
    { view: 'home',      icon: Home,         label: 'Home' },
    { view: 'play',      icon: Calendar,     label: 'Play' },
    { view: 'community', icon: Users,        label: 'Community' },
    { view: 'me',        icon: User,         label: 'Me' },
    { view: 'shop',      icon: ShoppingBag,  label: 'Shop' },
  ];

  if (isAdmin) {
    navItems.push({ view: 'admin', icon: Shield, label: 'Admin' });
  }

  return (
    <nav
      role="navigation"
      aria-label="Quick navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-2xl border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] z-50 safe-area-bottom"
    >
      <div className="flex items-center justify-around max-w-2xl mx-auto px-1 py-1.5">
        {navItems.map(({ view, icon: Icon, label }) => {
          const isActive = currentView === view;
          return (
            <motion.button
              key={view}
              onClick={() => handleClick(view)}
              whileTap={{ scale: 0.92 }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 gap-0.5"
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
                  isActive ? 'text-green-700 p-1.5' : 'text-slate-400 hover:text-slate-600 p-1.5'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`relative z-10 transition-colors duration-200 text-[10px] ${
                  isActive ? 'text-green-700 font-bold' : 'text-slate-400 font-medium'
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
