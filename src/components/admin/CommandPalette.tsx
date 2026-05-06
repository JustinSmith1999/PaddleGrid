import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, LayoutDashboard, Calendar, Users, Settings, TrendingUp,
  ClipboardList, Building2, Clock, UserPlus, DollarSign, FileText,
  Trophy, CreditCard, Mail, Bell, Target, Zap, Activity, AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: 'navigation' | 'action' | 'member';
  action: () => void;
}

interface CommandPaletteProps {
  onNavigate: (view: string) => void;
  onClose?: () => void;
}

export default function CommandPalette({ onNavigate, onClose }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    onClose?.();
  }, [onClose]);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // Navigation
    { id: 'dashboard', label: 'Dashboard', description: 'Overview & KPIs', icon: <LayoutDashboard className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('dashboard'); close(); } },
    { id: 'analytics', label: 'Smart Analytics', description: 'AI-powered insights', icon: <TrendingUp className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('analytics'); close(); } },
    { id: 'schedule', label: 'Court Scheduler', description: 'View court timeline', icon: <Calendar className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('schedule'); close(); } },
    { id: 'bookings', label: 'Reservations', description: 'Manage bookings', icon: <ClipboardList className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('bookings'); close(); } },
    { id: 'waitlist', label: 'Waitlist', description: 'Members waiting for courts', icon: <Clock className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('waitlist'); close(); } },
    { id: 'members', label: 'Members', description: 'Member directory', icon: <Users className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('members'); close(); } },
    { id: 'engagement', label: 'Engagement Scoring', description: 'Member health scores', icon: <Activity className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('engagement'); close(); } },
    { id: 'churn', label: 'Churn Alerts', description: 'At-risk members', icon: <AlertTriangle className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('churn-alerts'); close(); } },
    { id: 'series', label: 'Events & Series', description: 'Manage events', icon: <Trophy className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('series'); close(); } },
    { id: 'facilities', label: 'Courts & Facilities', description: 'Court management', icon: <Building2 className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('facilities'); close(); } },
    { id: 'transactions', label: 'Transactions', description: 'Payment history', icon: <DollarSign className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('transactions'); close(); } },
    { id: 'memberships', label: 'Memberships', description: 'Plans & subscriptions', icon: <CreditCard className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('memberships'); close(); } },
    { id: 'pricing', label: 'Dynamic Pricing', description: 'Time-based pricing rules', icon: <Zap className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('dynamic-pricing'); close(); } },
    { id: 'smartfill', label: 'Smart Fill', description: 'AI event suggestions', icon: <Target className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('smart-fill'); close(); } },
    { id: 'campaigns', label: 'Campaigns', description: 'Marketing campaigns', icon: <Mail className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('campaigns'); close(); } },
    { id: 'notifications', label: 'Notifications', description: 'Templates & preferences', icon: <Bell className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('notifications'); close(); } },
    { id: 'settings', label: 'Settings', description: 'Facility configuration', icon: <Settings className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('settings'); close(); } },
    { id: 'pre-registered', label: 'Import Members', description: 'Bulk import & onboard', icon: <UserPlus className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('pre-registered'); close(); } },
    { id: 'waivers', label: 'Waivers', description: 'Signed waivers', icon: <FileText className="w-4 h-4" />, category: 'navigation', action: () => { onNavigate('waivers'); close(); } },
  ];

  const filteredCommands = query.length === 0
    ? commands
    : commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(query.toLowerCase())
      );

  // Keyboard navigation
  useEffect(() => {
    const handleNav = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    document.addEventListener('keydown', handleNav);
    return () => document.removeEventListener('keydown', handleNav);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={close}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[61]"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search pages, actions, members..."
                  className="flex-1 text-sm text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                />
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded-md border border-slate-200">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
                {filteredCommands.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-slate-500">No results found</p>
                    <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                  </div>
                ) : (
                  filteredCommands.map((cmd, index) => (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                        index === selectedIndex ? 'bg-green-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        index === selectedIndex ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {cmd.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${index === selectedIndex ? 'text-green-900' : 'text-slate-900'}`}>
                          {cmd.label}
                        </p>
                        {cmd.description && (
                          <p className="text-[11px] text-slate-400 truncate">{cmd.description}</p>
                        )}
                      </div>
                      {index === selectedIndex && (
                        <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-2.5 border-t border-slate-100 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">↑↓</kbd>
                  <span className="text-[10px] text-slate-400">Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">↵</kbd>
                  <span className="text-[10px] text-slate-400">Select</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">ESC</kbd>
                  <span className="text-[10px] text-slate-400">Close</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
