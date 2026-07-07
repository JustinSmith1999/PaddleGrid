import { ReactNode, useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, X, Bell, Search,
  BarChart3, ClipboardList, Building2, CalendarRange, Clock, UserPlus, DollarSign,
  ArrowLeft, FileText, Trophy, Zap, ChevronLeft, CreditCard, TrendingUp,
  Target, Mail, MessageSquare, Shield, ChevronDown, ChevronRight, Activity, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CommandPalette from './CommandPalette';

interface AdminLayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: string;
  children?: { id: string; label: string }[];
}

const navigationSections: NavSection[] = [
  {
    label: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
      { id: 'analytics', label: 'Smart Analytics', icon: <TrendingUp className="w-[18px] h-[18px]" />, badge: 'AI' },
    ]
  },
  {
    label: 'SCHEDULING',
    items: [
      { id: 'schedule', label: 'Court Scheduler', icon: <Calendar className="w-[18px] h-[18px]" /> },
      { id: 'bookings', label: 'Reservations', icon: <ClipboardList className="w-[18px] h-[18px]" /> },
      { id: 'waitlist', label: 'Waitlist', icon: <Clock className="w-[18px] h-[18px]" /> },
      { id: 'facilities', label: 'Courts', icon: <Building2 className="w-[18px] h-[18px]" /> },
      { id: 'hours', label: 'Operating Hours', icon: <Clock className="w-[18px] h-[18px]" /> },
      { id: 'availability', label: 'Availability', icon: <Target className="w-[18px] h-[18px]" /> },
    ]
  },
  {
    label: 'EVENTS & LEAGUES',
    items: [
      { id: 'series', label: 'Events', icon: <CalendarRange className="w-[18px] h-[18px]" /> },
      { id: 'achievements', label: 'Leagues', icon: <Trophy className="w-[18px] h-[18px]" /> },
    ]
  },
  {
    label: 'MEMBERS',
    items: [
      { id: 'followers', label: 'Member List', icon: <Users className="w-[18px] h-[18px]" /> },
      { id: 'engagement', label: 'Engagement', icon: <Activity className="w-[18px] h-[18px]" />, badge: 'AI' },
      { id: 'churn-alerts', label: 'Churn Alerts', icon: <AlertTriangle className="w-[18px] h-[18px]" />, badge: 'AI' },
      { id: 'pre-registered', label: 'Import / Onboard', icon: <UserPlus className="w-[18px] h-[18px]" /> },
      { id: 'waivers', label: 'Waivers', icon: <FileText className="w-[18px] h-[18px]" /> },
    ]
  },
  {
    label: 'FINANCE',
    items: [
      { id: 'revenue', label: 'Revenue', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
      { id: 'transactions', label: 'Transactions', icon: <DollarSign className="w-[18px] h-[18px]" /> },
      { id: 'memberships', label: 'Memberships', icon: <CreditCard className="w-[18px] h-[18px]" /> },
      { id: 'dynamic-pricing', label: 'Dynamic Pricing', icon: <Zap className="w-[18px] h-[18px]" />, badge: 'AI' },
      { id: 'smart-fill', label: 'Smart Fill', icon: <Target className="w-[18px] h-[18px]" />, badge: 'AI' },
    ]
  },
  {
    label: 'GROWTH',
    items: [
      { id: 'sponsors', label: 'Sponsors', icon: <DollarSign className="w-[18px] h-[18px]" />, badge: 'NEW' },
      { id: 'group-blast', label: 'Reach Out to Groups', icon: <MessageSquare className="w-[18px] h-[18px]" />, badge: 'NEW' },
      { id: 'partnerships', label: 'Partnerships', icon: <Building2 className="w-[18px] h-[18px]" />, badge: 'NEW' },
      { id: 'integrations', label: 'Integrations', icon: <Zap className="w-[18px] h-[18px]" />, badge: 'NEW' },
      { id: 'pro-live', label: 'Pro Live', icon: 'Radio' },
  { id: 'amenities', label: 'Amenities', icon: <Sparkles className="w-[18px] h-[18px]" />, badge: 'NEW' },
      { id: 'push-blast', label: 'Push Blast', icon: <Bell className="w-[18px] h-[18px]" />, badge: 'NEW' },
      { id: 'ad-analytics', label: 'Ad Analytics', icon: <BarChart3 className="w-[18px] h-[18px]" />, badge: 'NEW' },
    ]
  },
  {
    label: 'COMMUNICATIONS',
    items: [
      { id: 'notifications', label: 'Push & Email', icon: <Bell className="w-[18px] h-[18px]" /> },
      { id: 'campaigns', label: 'Campaigns', icon: <Mail className="w-[18px] h-[18px]" />, badge: 'NEW' },
    ]
  },
];

// Tooltip component for collapsed sidebar
function Tooltip({ children, label, show }: { children: ReactNode; label: string; show: boolean }) {
  const [hovered, setHovered] = useState(false);

  if (!show) return <>{children}</>;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50"
          >
            <div className="bg-slate-800 text-white text-xs font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-lg">
              {label}
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-800" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stagger container variants
const navContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function AdminLayout({ children, currentView, onViewChange }: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile, signOut } = useAuth();
  const [facility, setFacility] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [notificationCount] = useState(3);

  useEffect(() => {
    const fetchFacility = async () => {
      if (!profile?.facility_id) return;
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('name, logo_url')
          .eq('id', profile.facility_id)
          .single();
        if (!error && data) setFacility(data);
      } catch (error) {
        console.error('Error fetching facility:', error);
      }
    };
    fetchFacility();
  }, [profile?.facility_id]);

  const currentLabel = navigationSections
    .flatMap(s => s.items)
    .find(item => item.id === currentView)?.label || 'Dashboard';

  const currentSection = navigationSections
    .find(s => s.items.some(item => item.id === currentView))?.label || 'Overview';

  const handleSignOut = async () => {
    await signOut();
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const collapsed = isSidebarCollapsed && !isMobile;
    let globalIndex = 0;

    return (
      <div className="flex flex-col h-full" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Logo / Brand */}
        <div className={`flex items-center ${collapsed ? 'justify-center px-3' : 'justify-between px-5'} h-[64px] border-b border-slate-200 shrink-0`}>
          {!collapsed && (
            <motion.div
              className="flex items-center gap-3"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm tracking-tight">PG</span>
              </div>
              <div>
                <h1 className="font-semibold text-[15px] text-slate-800 leading-tight">
                  {facility?.name || 'PaddleGrid'}
                </h1>
                <p className="text-[11px] text-slate-400 font-medium tracking-wide">Admin Console</p>
              </div>
            </motion.div>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm tracking-tight">PG</span>
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors duration-200 text-slate-400 hover:text-slate-600"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
          {isMobile && (
            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pt-4 pb-2 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all duration-200"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin">
          {navigationSections.map((section) => (
            <motion.div
              key={section.label}
              variants={navContainerVariants}
              initial="hidden"
              animate="show"
            >
              {!collapsed && (
                <motion.p
                  variants={navItemVariants}
                  className="px-3 mb-2 text-[10px] font-semibold text-slate-400 tracking-[0.1em] uppercase select-none"
                >
                  {section.label}
                </motion.p>
              )}
              {collapsed && (
                <div className="w-6 h-px bg-slate-200 mx-auto mb-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = currentView === item.id;
                  const itemIndex = globalIndex++;
                  return (
                    <motion.div key={item.id} variants={navItemVariants}>
                      <Tooltip label={item.label} show={collapsed}>
                        <button
                          onClick={() => {
                            onViewChange(item.id);
                            if (isMobile) setIsMobileSidebarOpen(false);
                          }}
                          className={`relative w-full flex items-center gap-2.5 transition-all duration-200 group ${
                            collapsed ? 'justify-center px-2 py-2.5 rounded-lg' : 'px-3 py-2 rounded-r-lg'
                          } ${
                            isActive
                              ? 'bg-green-50/80 text-green-700'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                          }`}
                        >
                          {/* Active left border accent */}
                          {isActive && !collapsed && (
                            <motion.div
                              layoutId="activeNavIndicator"
                              className="absolute left-0 top-1 bottom-1 w-[3px] bg-green-600 rounded-r-full"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}
                          {isActive && collapsed && (
                            <motion.div
                              layoutId="activeNavIndicatorCollapsed"
                              className="absolute left-0 top-1 bottom-1 w-[3px] bg-green-600 rounded-r-full"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}
                          <span className={`transition-colors duration-200 ${isActive ? 'text-green-600' : 'text-slate-400 group-hover:text-slate-500'}`}>
                            {item.icon}
                          </span>
                          {!collapsed && (
                            <>
                              <span className={`text-[13px] font-medium flex-1 text-left transition-colors duration-200 ${isActive ? 'text-green-700' : ''}`}>
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  item.badge === 'AI'
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-sm shadow-green-200'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      </Tooltip>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-slate-200 p-3 space-y-0.5 shrink-0">
          <Tooltip label="Settings" show={collapsed}>
            <button
              onClick={() => onViewChange('settings')}
              className={`relative w-full flex items-center gap-2.5 rounded-lg transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 group ${
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
              } ${currentView === 'settings' ? 'bg-green-50/80 text-green-700' : ''}`}
            >
              {currentView === 'settings' && !collapsed && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-1 bottom-1 w-[3px] bg-green-600 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Settings className={`w-[18px] h-[18px] transition-colors duration-200 ${currentView === 'settings' ? 'text-green-600' : ''}`} />
              {!collapsed && <span className="text-[13px] font-medium">Settings</span>}
            </button>
          </Tooltip>
          <Tooltip label="Back to App" show={collapsed}>
            <button
              onClick={() => window.location.href = '/'}
              className={`w-full flex items-center gap-2.5 rounded-lg transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 ${
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
              }`}
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
              {!collapsed && <span className="text-[13px] font-medium">Back to App</span>}
            </button>
          </Tooltip>
          <Tooltip label="Sign Out" show={collapsed}>
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-2.5 rounded-lg transition-all duration-200 text-red-400 hover:bg-red-50 hover:text-red-500 ${
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
              }`}
            >
              <LogOut className="w-[18px] h-[18px]" />
              {!collapsed && <span className="text-[13px] font-medium">Sign Out</span>}
            </button>
          </Tooltip>
        </div>

        {/* User Profile */}
        <div className="border-t border-slate-200 shrink-0">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="expanded-profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-4 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-sm font-semibold shadow-sm ring-2 ring-green-100">
                    {(profile?.full_name || profile?.first_name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-700 truncate">
                      {profile?.full_name || profile?.first_name || 'Admin'}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-green-700 bg-green-50 rounded-full capitalize mt-0.5">
                      {profile?.role || 'Super Admin'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="py-3 flex justify-center"
              >
                <Tooltip label={profile?.full_name || profile?.first_name || 'Admin'} show={true}>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-sm font-semibold shadow-sm ring-2 ring-green-100 cursor-default">
                    {(profile?.full_name || profile?.first_name || 'A').charAt(0).toUpperCase()}
                  </div>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8F9FC]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Command Palette */}
      <CommandPalette onNavigate={onViewChange} />

      {/* Desktop Sidebar */}
      <motion.aside
        layout
        className="hidden lg:flex flex-col bg-white border-r border-slate-200 overflow-hidden shrink-0"
        animate={{ width: isSidebarCollapsed ? 68 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl lg:hidden"
          >
            <SidebarContent isMobile />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-8 h-[64px] flex items-center justify-between shrink-0" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase hidden sm:block">
                {currentSection}
              </p>
              <h1 className="text-lg font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Manrope, Inter, system-ui, sans-serif' }}>
                {currentLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search (Desktop) -- triggers Command Palette */}
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden md:flex items-center gap-2 w-64 pl-3 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-400 hover:border-green-300 hover:bg-white transition-all duration-200"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left text-slate-400">Search...</span>
              <kbd className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                &#8984;K
              </kbd>
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors duration-200">
              <Bell className="w-5 h-5 text-slate-400" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* User (Desktop) */}
            <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                {(profile?.full_name || profile?.first_name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-slate-700 leading-tight">
                  {profile?.full_name || profile?.first_name || 'Admin'}
                </p>
                <p className="text-[11px] text-slate-400 capitalize">
                  {profile?.role || 'Super Admin'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="w-full max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
