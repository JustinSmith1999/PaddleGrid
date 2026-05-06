import { ReactNode, useState, useEffect } from 'react';
import {
  LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, X, Bell, Search,
  BarChart3, ClipboardList, Building2, CalendarRange, Clock, UserPlus, DollarSign,
  ArrowLeft, FileText, Trophy, Zap, ChevronLeft, CreditCard, TrendingUp,
  Target, Mail, MessageSquare, Shield, ChevronDown, ChevronRight, Activity, AlertTriangle
} from 'lucide-react';
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
      { id: 'members', label: 'Member List', icon: <Users className="w-[18px] h-[18px]" /> },
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
    label: 'COMMUNICATIONS',
    items: [
      { id: 'notifications', label: 'Push & Email', icon: <Bell className="w-[18px] h-[18px]" /> },
      { id: 'campaigns', label: 'Campaigns', icon: <Mail className="w-[18px] h-[18px]" />, badge: 'NEW' },
    ]
  },
];

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

  const handleSignOut = async () => {
    await signOut();
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className={`flex items-center ${isSidebarCollapsed && !isMobile ? 'justify-center px-3' : 'justify-between px-5'} py-5 border-b border-slate-100`}>
        {(!isSidebarCollapsed || isMobile) && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center shadow-md shadow-green-200">
              <span className="text-white font-bold text-sm">PG</span>
            </div>
            <div>
              <h1 className="font-semibold text-[15px] text-slate-800 leading-tight">
                {facility?.name || 'PaddleGrid'}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Admin Console</p>
            </div>
          </div>
        )}
        {isSidebarCollapsed && !isMobile && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center shadow-md shadow-green-200">
            <span className="text-white font-bold text-sm">PG</span>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
        {isMobile && (
          <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search */}
      {(!isSidebarCollapsed || isMobile) && (
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin">
        {navigationSections.map((section) => (
          <div key={section.label}>
            {(!isSidebarCollapsed || isMobile) && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-300 tracking-[0.08em] uppercase">
                {section.label}
              </p>
            )}
            {isSidebarCollapsed && !isMobile && (
              <div className="w-6 h-px bg-slate-100 mx-auto mb-2" />
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      if (isMobile) setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-lg transition-all duration-150 ${
                      isSidebarCollapsed && !isMobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-green-50 text-green-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                    title={isSidebarCollapsed && !isMobile ? item.label : undefined}
                  >
                    <span className={isActive ? 'text-green-600' : 'text-slate-400'}>{item.icon}</span>
                    {(!isSidebarCollapsed || isMobile) && (
                      <>
                        <span className={`text-[13px] font-medium flex-1 text-left ${isActive ? 'text-green-700' : ''}`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.badge === 'AI'
                              ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-100 p-3 space-y-0.5">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-2.5 rounded-lg transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-700 ${
            isSidebarCollapsed && !isMobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
          } ${currentView === 'settings' ? 'bg-green-50 text-green-700' : ''}`}
        >
          <Settings className="w-[18px] h-[18px]" />
          {(!isSidebarCollapsed || isMobile) && <span className="text-[13px] font-medium">Settings</span>}
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className={`w-full flex items-center gap-2.5 rounded-lg transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-700 ${
            isSidebarCollapsed && !isMobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
          }`}
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          {(!isSidebarCollapsed || isMobile) && <span className="text-[13px] font-medium">Back to App</span>}
        </button>
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-2.5 rounded-lg transition-all text-red-400 hover:bg-red-50 hover:text-red-500 ${
            isSidebarCollapsed && !isMobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
          }`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {(!isSidebarCollapsed || isMobile) && <span className="text-[13px] font-medium">Sign Out</span>}
        </button>
      </div>

      {/* User Profile */}
      {(!isSidebarCollapsed || isMobile) && (
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
              {(profile?.full_name || profile?.first_name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-slate-700 truncate">
                {profile?.full_name || profile?.first_name || 'Admin'}
              </p>
              <p className="text-[11px] text-slate-400 truncate capitalize">
                {profile?.role || 'Super Admin'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Command Palette */}
      <CommandPalette onNavigate={onViewChange} />

      {/* Desktop Sidebar */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
        } hidden lg:flex flex-col bg-white border-r border-slate-100 transition-all duration-200`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200 ${
          isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl transform transition-transform duration-200 lg:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent isMobile />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">{currentLabel}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search (Desktop) — triggers Command Palette */}
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden md:flex items-center gap-2 w-64 pl-3 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-300 hover:border-green-300 hover:bg-white transition-all"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">⌘K</kbd>
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* User (Desktop) */}
            <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-slate-100">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-semibold">
                {(profile?.full_name || profile?.first_name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-slate-700 leading-tight">
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="w-full max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
