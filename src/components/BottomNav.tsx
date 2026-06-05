import { Home, Calendar, Users, Plus, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

type ViewType =
  | 'home' | 'play' | 'community' | 'me'
  | 'admin' | 'browse' | 'bookings' | 'profile' | 'series' | 'my-series'
  | 'discover' | 'messages' | 'trending' | 'waitlist' | 'partners'
  | 'rewards' | 'groups' | 'match-requests' | 'shop';

interface BottomNavProps { onViewChange: (view: ViewType) => void }

/**
 * Five-button bottom bar with breathing room: icon + label, taller bar,
 * full-width spread on the screen, soft hover/active state.
 * [Home] [Play] [+] [Community] [Menu]
 */
export function BottomNav({ onViewChange }: BottomNavProps) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const getCurrentView = (): ViewType => {
    const p = location.pathname;
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
    return 'home';
  };
  const currentView = getCurrentView();

  const go = (view: ViewType) => {
    switch (view) {
      case 'home':      onViewChange('community'); break;
      case 'play':      onViewChange('browse'); break;
      case 'community': onViewChange('discover'); break;
      default:          onViewChange(view);
    }
  };

  const openCompose = () => window.dispatchEvent(new CustomEvent('pg:compose-post'));
  const openMenu    = () => window.dispatchEvent(new CustomEvent('pg:open-menu'));

  return (
    <nav
      role="navigation"
      aria-label="Quick navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
    >
      <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-2px_18px_rgba(0,0,0,0.04)]">
        <div className="flex items-end justify-between px-2 pt-2 pb-2.5">

          <NavItem onClick={() => go('home')}      isActive={currentView === 'home'}      Icon={Home}     label="Home" />
          <NavItem onClick={() => go('play')}      isActive={currentView === 'play'}      Icon={Calendar} label="Play" />

          {/* Center + — raised, prominent */}
          <motion.button
            onClick={openCompose}
            whileTap={{ scale: 0.9 }}
            aria-label="New post"
            className="relative -mt-7 w-[60px] h-[60px] rounded-full bg-emerald-800 hover:bg-emerald-900 shadow-[0_8px_22px_rgba(22,41,30,0.32)] flex items-center justify-center text-white ring-[5px] ring-white flex-shrink-0"
          >
            <Plus className="w-7 h-7" strokeWidth={2.6} />
          </motion.button>

          <NavItem onClick={() => go('community')} isActive={currentView === 'community'} Icon={Users}    label="Community" />
          <NavItem onClick={openMenu}              isActive={false}                       Icon={Menu}     label="Menu" />

        </div>
      </div>
    </nav>
  );
}

function NavItem({
  onClick, isActive, Icon, label,
}: { onClick: () => void; isActive: boolean; Icon: any; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      className="relative flex flex-col items-center justify-end gap-0.5 w-16 pt-1.5 pb-0.5"
    >
      <Icon
        className={`w-[24px] h-[24px] transition-colors ${isActive ? 'text-emerald-900' : 'text-slate-400'}`}
        strokeWidth={isActive ? 2.4 : 2}
      />
      <span
        className={`text-[10px] tracking-[0.04em] font-bold transition-colors ${
          isActive ? 'text-emerald-900' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
      {isActive && (
        <motion.span
          layoutId="bottomNavDot"
          className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-emerald-700"
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        />
      )}
    </motion.button>
  );
}
