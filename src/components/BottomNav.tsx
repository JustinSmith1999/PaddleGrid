import { Home, Calendar, Users, ShoppingBag, Shield } from 'lucide-react';
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
  | 'trending' | 'waitlist' | 'partners' | 'rewards' | 'groups' | 'match-requests';

interface BottomNavProps {
  onViewChange: (view: ViewType) => void;
}

/**
 * Instagram-style icon-only bottom nav.
 * Single row of bubble icons — no text labels. Active tab gets a filled
 * forest-green pill behind the icon. The Me tab is a circular avatar
 * (or initials fallback) so the user's identity sits in the bar like IG.
 */
export function BottomNav({ onViewChange }: BottomNavProps) {
  const { user, isAdmin, profile } = useAuth();
  const location = useLocation();

  const getCurrentView = (): ViewType => {
    const p = location.pathname;
    if (p.startsWith('/admin')) return 'admin';
    if (
      p.startsWith('/browse') || p.startsWith('/bookings') ||
      p.startsWith('/series') || p.startsWith('/events') ||
      p.startsWith('/waitlist') || p.startsWith('/club/') ||
      p.startsWith('/match-requests')
    ) return 'play';
    if (
      p.startsWith('/messages') || p.startsWith('/discover') ||
      p.startsWith('/partners') || p.startsWith('/player/') ||
      p.startsWith('/groups')
    ) return 'community';
    if (
      p.startsWith('/profile') || p.startsWith('/rewards') ||
      p.startsWith('/my-series') || p.startsWith('/account')
    ) return 'me';
    if (p.startsWith('/merch') || p.startsWith('/shop')) return 'shop';
    return 'home';
  };

  const currentView = getCurrentView();
  if (!user) return null;

  const handleClick = (view: ViewType) => {
    switch (view) {
      case 'home':      onViewChange('community'); break; // feed
      case 'play':      onViewChange('browse'); break;
      case 'community': onViewChange('discover'); break;
      case 'me':        onViewChange('profile'); break;
      case 'shop':      onViewChange('browse'); break;
      case 'admin':     onViewChange('admin'); break;
      default:          onViewChange(view);
    }
  };

  const navItems: { view: ViewType; icon: any; label: string }[] = [
    { view: 'home',      icon: Home,         label: 'Home' },
    { view: 'play',      icon: Calendar,     label: 'Play' },
    { view: 'community', icon: Users,        label: 'Community' },
    { view: 'shop',      icon: ShoppingBag,  label: 'Shop' },
  ];
  if (isAdmin) {
    navItems.push({ view: 'admin', icon: Shield, label: 'Admin' });
  }

  // First initial fallback if no avatar
  const initial =
    (profile?.full_name?.[0] ||
      profile?.first_name?.[0] ||
      user.email?.[0] ||
      '?').toUpperCase();
  const avatarUrl = profile?.profile_picture_url || profile?.avatar_url;

  return (
    <nav
      role="navigation"
      aria-label="Quick navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
    >
      <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200/70 shadow-[0_-2px_18px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around max-w-md mx-auto px-2 py-1.5">
          {navItems.map(({ view, icon: Icon, label }) => {
            const isActive = currentView === view;
            return (
              <motion.button
                key={view}
                onClick={() => handleClick(view)}
                whileTap={{ scale: 0.88 }}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
                className="relative flex items-center justify-center w-12 h-12 rounded-full"
              >
                {isActive && (
                  <motion.span
                    layoutId="bottomNavBubble"
                    className="absolute inset-0 bg-emerald-700 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  />
                )}
                <Icon
                  className={`relative z-10 w-6 h-6 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
              </motion.button>
            );
          })}

          {/* "Me" tab — circular avatar bubble (Instagram-style) */}
          <motion.button
            onClick={() => handleClick('me')}
            whileTap={{ scale: 0.88 }}
            aria-current={currentView === 'me' ? 'page' : undefined}
            aria-label="Me"
            className="relative flex items-center justify-center w-12 h-12"
          >
            <span
              className={`relative inline-flex w-9 h-9 rounded-full overflow-hidden items-center justify-center transition ${
                currentView === 'me'
                  ? 'ring-[2.5px] ring-emerald-700 ring-offset-1 ring-offset-white'
                  : 'ring-1 ring-slate-200'
              }`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-800 text-white text-[13px] font-bold">
                  {initial}
                </span>
              )}
            </span>
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
