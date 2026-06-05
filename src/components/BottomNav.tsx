import { Home, Calendar, Users, Plus, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

type ViewType =
  | 'home' | 'play' | 'community' | 'me'
  // Legacy view types kept so the App.tsx handleViewChange still maps cleanly:
  | 'admin' | 'browse' | 'bookings' | 'profile' | 'series' | 'my-series'
  | 'discover' | 'messages' | 'trending' | 'waitlist' | 'partners'
  | 'rewards' | 'groups' | 'match-requests' | 'shop';

interface BottomNavProps { onViewChange: (view: ViewType) => void }

/**
 * Five-button bottom bar — [Home] [Play] [+] [Community] [Menu]
 * The center + is the raised, prominent action.
 * The hamburger replaces the old Shop/Me icons; the avatar lives in the
 * top-right of the global Navbar instead.
 *
 * The + and ☰ buttons dispatch global window events so any page can react:
 *   • 'pg:compose-post' → CommunityHub opens its PostComposer
 *   • 'pg:open-menu'    → MobileMenu opens its slide-out drawer
 *
 * This kills the two floating FABs that used to hover next to the nav.
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
      case 'home':      onViewChange('community'); break; // feed
      case 'play':      onViewChange('browse'); break;
      case 'community': onViewChange('discover'); break;
      default:          onViewChange(view);
    }
  };

  const openCompose = () => {
    window.dispatchEvent(new CustomEvent('pg:compose-post'));
  };
  const openMenu = () => {
    window.dispatchEvent(new CustomEvent('pg:open-menu'));
  };

  const sideItems: Array<{ view: ViewType; icon: any; label: string }> = [
    { view: 'home',      icon: Home,     label: 'Home' },
    { view: 'play',      icon: Calendar, label: 'Play' },
  ];
  const sideItemsRight: Array<{ view: ViewType; icon: any; label: string }> = [
    { view: 'community', icon: Users,    label: 'Community' },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Quick navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
    >
      <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200/70 shadow-[0_-2px_18px_rgba(0,0,0,0.04)]">
        <div className="relative flex items-center justify-around max-w-md mx-auto px-2 py-1.5">
          {/* Left two tabs */}
          {sideItems.map(({ view, icon: Icon, label }) => {
            const isActive = currentView === view;
            return (
              <NavBubble
                key={view}
                onClick={() => go(view)}
                isActive={isActive}
                Icon={Icon}
                label={label}
              />
            );
          })}

          {/* Center + button — raised, prominent */}
          <motion.button
            onClick={openCompose}
            whileTap={{ scale: 0.9 }}
            aria-label="New post"
            className="relative -mt-6 w-14 h-14 rounded-full bg-emerald-800 hover:bg-emerald-900 shadow-[0_6px_20px_rgba(22,41,30,0.35)] flex items-center justify-center text-white ring-4 ring-white"
          >
            <Plus className="w-7 h-7" strokeWidth={2.6} />
          </motion.button>

          {/* Right one tab */}
          {sideItemsRight.map(({ view, icon: Icon, label }) => {
            const isActive = currentView === view;
            return (
              <NavBubble
                key={view}
                onClick={() => go(view)}
                isActive={isActive}
                Icon={Icon}
                label={label}
              />
            );
          })}

          {/* Menu button (hamburger) — opens the MobileMenu drawer */}
          <motion.button
            onClick={openMenu}
            whileTap={{ scale: 0.88 }}
            aria-label="Open menu"
            className="relative flex items-center justify-center w-12 h-12 rounded-full"
          >
            <Menu className="w-6 h-6 text-slate-500" strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    </nav>
  );
}

function NavBubble({
  onClick, isActive, Icon, label,
}: { onClick: () => void; isActive: boolean; Icon: any; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      className="relative flex items-center justify-center w-12 h-12 rounded-full"
    >
      {isActive && (
        <motion.span
          layoutId="bottomNavBubble"
          className="absolute inset-0 bg-emerald-800 rounded-full"
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
}
