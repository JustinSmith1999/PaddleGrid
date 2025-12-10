import { useState } from 'react';
import { Calendar, Grid3x3, Loader2 } from 'lucide-react';
import { BrowseCourts } from './BrowseCourts';
import { UserBookings } from './UserBookings';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'browse' | 'mybookings';

export function PlayerDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please sign in</h2>
          <p className="text-gray-600">You need to be signed in to access the player dashboard</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'browse' as TabType,
      label: 'Recommended Clubs',
      icon: Grid3x3,
      description: 'Discover pickleball clubs in your area'
    },
    {
      id: 'mybookings' as TabType,
      label: 'My Bookings',
      icon: Calendar,
      description: 'Manage your court reservations'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Player Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back! Browse courts and manage your bookings</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <div className="flex flex-col sm:flex-row">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
                      isActive
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </div>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-gray-600">
                {tabs.find(t => t.id === activeTab)?.description}
              </p>
            </div>
          </div>
        </div>

        <div className="animate-fadeIn">
          {activeTab === 'browse' && (
            <div>
              <BrowseCourts />
            </div>
          )}

          {activeTab === 'mybookings' && (
            <div>
              <UserBookings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
