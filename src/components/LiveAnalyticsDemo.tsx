import { useState, useEffect } from 'react';
import { DollarSign, Users, Calendar, TrendingUp, X, Activity } from 'lucide-react';

interface LiveAnalyticsDemoProps {
  onClose: () => void;
}

export function LiveAnalyticsDemo({ onClose }: LiveAnalyticsDemoProps) {
  const [revenue, setRevenue] = useState(12547.50);
  const [bookings, setBookings] = useState(87);
  const [activeUsers, setActiveUsers] = useState(234);
  const [courtUtilization, setCourtUtilization] = useState(78.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setRevenue(prev => prev + (Math.random() * 50 - 10));
      if (Math.random() > 0.7) {
        setBookings(prev => prev + 1);
      }
      setActiveUsers(prev => Math.max(100, prev + Math.floor(Math.random() * 10 - 4)));
      setCourtUtilization(prev => Math.min(95, Math.max(60, prev + (Math.random() * 4 - 2))));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      title: 'Today\'s Revenue',
      value: `$${revenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      change: '+12.5%',
    },
    {
      title: 'Total Bookings',
      value: bookings.toString(),
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      change: '+8.3%',
    },
    {
      title: 'Active Users',
      value: activeUsers.toString(),
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      change: '+15.7%',
    },
    {
      title: 'Court Utilization',
      value: `${courtUtilization.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-cyan-500 to-cyan-600',
      change: '+5.2%',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Live Performance Dashboard</h2>
            </div>
            <p className="text-emerald-100 text-xs sm:text-sm">Real-time updates every 2 seconds</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-white to-gray-50 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all p-3 sm:p-4 md:p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                  <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm font-semibold text-emerald-600">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{stat.change}</span>
                  </div>
                </div>
                <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">
                  {stat.title}
                </h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 transition-all duration-300">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 border border-emerald-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Live Activity Feed</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {[
                { time: 'Just now', event: 'New booking: Court 3 - 2:00 PM', amount: '$45.00' },
                { time: '12 seconds ago', event: 'Membership renewed: Sarah Johnson', amount: '$199.00' },
                { time: '45 seconds ago', event: 'New booking: Court 1 - 3:30 PM', amount: '$45.00' },
                { time: '1 minute ago', event: 'Event registration: Summer Tournament', amount: '$75.00' },
                { time: '2 minutes ago', event: 'New booking: Court 5 - 5:00 PM', amount: '$50.00' },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 transition-all"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium text-gray-800 text-xs sm:text-sm md:text-base truncate">{activity.event}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{activity.time}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-emerald-600 text-xs sm:text-sm md:text-base">{activity.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">Real-Time Insights</h3>
              <p className="text-emerald-100 mb-3 sm:mb-4 text-xs sm:text-sm">
                Every metric updates automatically as transactions occur
              </p>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full flex-shrink-0"></div>
                  No manual refreshing required
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full flex-shrink-0"></div>
                  Instant revenue tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full flex-shrink-0"></div>
                  Live booking notifications
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">Data-Driven Decisions</h3>
              <p className="text-blue-100 mb-3 sm:mb-4 text-xs sm:text-sm">
                Make informed choices with up-to-the-second analytics
              </p>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full flex-shrink-0"></div>
                  Identify peak hours instantly
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full flex-shrink-0"></div>
                  Track member engagement
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full flex-shrink-0"></div>
                  Optimize pricing dynamically
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
