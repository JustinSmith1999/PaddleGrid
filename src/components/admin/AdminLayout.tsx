import { ReactNode, useState } from 'react';
import {
  LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, X, Sun, Moon, Bell,
  BarChart3, ClipboardList, Building2, CalendarRange, Clock, UserPlus, DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface AdminLayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  roles?: string[];
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'facilities', label: 'Courts', icon: <Building2 className="w-5 h-5" /> },
  { id: 'hours', label: 'Operating Hours', icon: <Clock className="w-5 h-5" /> },
  { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
  { id: 'availability', label: 'Court Availability', icon: <Clock className="w-5 h-5" /> },
  { id: 'bookings', label: 'Bookings', icon: <ClipboardList className="w-5 h-5" /> },
  { id: 'series', label: 'Event Series', icon: <CalendarRange className="w-5 h-5" /> },
  { id: 'members', label: 'Members', icon: <Users className="w-5 h-5" /> },
  { id: 'pre-registered', label: 'Import Users', icon: <UserPlus className="w-5 h-5" /> },
  { id: 'transactions', label: 'Transactions', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export default function AdminLayout({ children, currentView, onViewChange }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const userRole = (user as any)?.role || 'user';

  const filteredNav = navigationItems.filter(item =>
    !item.roles || item.roles.includes(userRole)
  );

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-stone-50">
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } hidden lg:flex flex-col bg-white border-r border-stone-200 transition-all duration-300 shadow-sm`}
      >
        <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-green-50">
          {isSidebarOpen && (
            <div className="flex items-center space-x-2">
              <img
                src="/screenshot_2025-12-05_150441-removebg-preview.png"
                alt="PaddleGrid Logo"
                className="h-10 w-auto"
              />
              <div>
                <span className="font-bold text-xl text-emerald-800">PaddleGrid</span>
                <div className="text-xs text-emerald-600 font-medium">Club Management</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-emerald-700"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
          {filteredNav.map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
                currentView === item.id
                  ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 shadow-sm border border-emerald-200'
                  : 'text-stone-700 hover:bg-stone-50 hover:text-emerald-700'
              }`}
            >
              {item.icon}
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-stone-200 p-4 space-y-2 bg-stone-25">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-emerald-700 transition-all font-medium"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isSidebarOpen && <span className="font-medium">{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${
          isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200 transform transition-transform lg:hidden shadow-xl ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-green-50">
          <div className="flex items-center space-x-2">
            <img
              src="/screenshot_2025-12-05_150441-removebg-preview.png"
              alt="PaddleGrid Logo"
              className="h-10 w-auto"
            />
            <div>
              <span className="font-bold text-xl text-emerald-800">PaddleGrid</span>
              <div className="text-xs text-emerald-600 font-medium">Club Management</div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-emerald-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
          {filteredNav.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
                currentView === item.id
                  ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 shadow-sm border border-emerald-200'
                  : 'text-stone-700 hover:bg-stone-50 hover:text-emerald-700'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-stone-200 p-4 space-y-2 bg-stone-25">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-emerald-700 transition-all font-medium"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-medium">{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-stone-200 px-4 lg:px-8 py-5 shadow-sm">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-stone-100 text-emerald-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-stone-800">
                  Welcome back, {((user as any)?.full_name || (user as any)?.first_name || 'Admin').split(' ')[0]}
                </h1>
                <p className="text-sm text-stone-600 font-medium">
                  {filteredNav.find(item => item.id === currentView)?.label || 'Dashboard'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-lg hover:bg-stone-100 transition-colors">
                <Bell className="w-5 h-5 text-stone-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-emerald-800">
                    {(user as any)?.full_name || 'Admin'}
                  </p>
                  <p className="text-xs text-emerald-600 capitalize font-medium">
                    {userRole}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-stone-50 p-4 lg:p-8">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
