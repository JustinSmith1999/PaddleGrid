import { useState, useEffect } from 'react';
import { DollarSign, Users, Calendar, TrendingUp, Loader2, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  activeMembers: number;
  revenueToday: number;
  bookingsToday: number;
  topCourt: string;
  upcomingEvents: number;
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalBookings: 0,
    totalUsers: 0,
    activeMembers: 0,
    revenueToday: 0,
    bookingsToday: 0,
    topCourt: 'N/A',
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [
        { data: reservations },
        { data: allReservationsWithCourts },
        { data: todayReservationsWithCourts },
        { data: users },
        { data: members },
        { data: todayReservations },
        { data: courts },
        { data: events },
      ] = await Promise.all([
        supabase.from('court_availability_blocks').select('court_id').eq('block_type', 'reservation'),
        supabase.from('court_availability_blocks').select('start_time, end_time, courts(hourly_rate)').eq('block_type', 'reservation'),
        supabase.from('court_availability_blocks').select('start_time, end_time, courts(hourly_rate)').eq('block_type', 'reservation').eq('block_date', today),
        supabase.from('profiles').select('id'),
        supabase.from('user_memberships').select('id').eq('status', 'active'),
        supabase
          .from('court_availability_blocks')
          .select('id')
          .eq('block_type', 'reservation')
          .eq('block_date', today),
        supabase.from('courts').select('id, name'),
        supabase
          .from('events')
          .select('id')
          .eq('is_published', true)
          .gte('start_datetime', new Date().toISOString()),
      ]);

      const calculateRevenue = (reservations: any[]) => {
        return reservations?.reduce((sum, res) => {
          const startTime = new Date(`2000-01-01T${res.start_time}`);
          const endTime = new Date(`2000-01-01T${res.end_time}`);
          const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          const hourlyRate = Number(res.courts?.hourly_rate || 0);
          return sum + (durationHours * hourlyRate);
        }, 0) || 0;
      };

      const totalRevenue = calculateRevenue(allReservationsWithCourts || []);
      const revenueToday = calculateRevenue(todayReservationsWithCourts || []);

      const courtCounts: Record<string, number> = {};
      reservations?.forEach((reservation) => {
        courtCounts[reservation.court_id] = (courtCounts[reservation.court_id] || 0) + 1;
      });

      const topCourtId = Object.keys(courtCounts).reduce((a, b) =>
        courtCounts[a] > courtCounts[b] ? a : b
      , '');

      const topCourtName =
        courts?.find((c) => c.id === topCourtId)?.name || 'N/A';

      setAnalytics({
        totalRevenue,
        totalBookings: reservations?.length || 0,
        totalUsers: users?.length || 0,
        activeMembers: members?.length || 0,
        revenueToday,
        bookingsToday: todayReservations?.length || 0,
        topCourt: topCourtName,
        upcomingEvents: events?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${analytics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Bookings',
      value: analytics.totalBookings.toLocaleString(),
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Users',
      value: analytics.totalUsers.toLocaleString(),
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Active Members',
      value: analytics.activeMembers.toLocaleString(),
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  const todayStats = [
    {
      label: 'Revenue Today',
      value: `$${analytics.revenueToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
    },
    {
      label: 'Bookings Today',
      value: analytics.bookingsToday.toString(),
      icon: Calendar,
    },
    {
      label: 'Most Popular Court',
      value: analytics.topCourt,
      icon: Trophy,
    },
    {
      label: 'Upcoming Events',
      value: analytics.upcomingEvents.toString(),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">
                {stat.title}
              </h3>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayStats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100"
            >
              <div className="bg-emerald-100 p-3 rounded-lg mr-4">
                <stat.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Revenue Growth</h3>
          <p className="text-emerald-100 mb-4">
            Track your facility's financial performance
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">${analytics.totalRevenue.toFixed(2)}</p>
              <p className="text-emerald-100 text-sm">All-time revenue</p>
            </div>
            <TrendingUp className="w-16 h-16 text-emerald-300 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Booking Performance</h3>
          <p className="text-blue-100 mb-4">
            Monitor court utilization and bookings
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">{analytics.totalBookings}</p>
              <p className="text-blue-100 text-sm">Total bookings</p>
            </div>
            <Calendar className="w-16 h-16 text-blue-300 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
