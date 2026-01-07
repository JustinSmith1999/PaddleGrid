import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, DollarSign, Clock, BarChart3, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

interface CourtUtilization {
  court_name: string;
  total_bookings: number;
  total_hours: number;
  utilization_rate: number;
}

interface PeakHour {
  hour: string;
  bookings: number;
}

interface AgeDemographic {
  age_range: string;
  count: number;
  avg_playtime: number;
}

interface RevenueMetrics {
  total_revenue: number;
  total_bookings: number;
  avg_booking_value: number;
  total_hours_booked: number;
}

export function AdminReporting() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [facilityId, setFacilityId] = useState<string | null>(null);

  const [bookingTrends, setBookingTrends] = useState<BookingTrend[]>([]);
  const [courtUtilization, setCourtUtilization] = useState<CourtUtilization[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [ageDemographics, setAgeDemographics] = useState<AgeDemographic[]>([]);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>({
    total_revenue: 0,
    total_bookings: 0,
    avg_booking_value: 0,
    total_hours_booked: 0
  });

  useEffect(() => {
    if (user) {
      loadFacilityAndData();
    }
  }, [user, dateRange]);

  async function loadFacilityAndData() {
    setLoading(true);
    try {
      const { data: facilityUser } = await supabase
        .from('facility_users')
        .select('facility_id, role')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!facilityUser) {
        setLoading(false);
        return;
      }

      setFacilityId(facilityUser.facility_id);
      await Promise.all([
        loadBookingTrends(facilityUser.facility_id),
        loadCourtUtilization(facilityUser.facility_id),
        loadPeakHours(facilityUser.facility_id),
        loadAgeDemographics(facilityUser.facility_id),
        loadRevenueMetrics(facilityUser.facility_id)
      ]);
    } catch (error) {
      console.error('Error loading reporting data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDateFilter() {
    const now = new Date();
    if (dateRange === '7d') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo.toISOString().split('T')[0];
    } else if (dateRange === '30d') {
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return monthAgo.toISOString().split('T')[0];
    } else if (dateRange === '90d') {
      const quarterAgo = new Date(now);
      quarterAgo.setDate(quarterAgo.getDate() - 90);
      return quarterAgo.toISOString().split('T')[0];
    }
    return null;
  }

  async function loadBookingTrends(facilityId: string) {
    const dateFilter = getDateFilter();
    let query = supabase
      .from('bookings')
      .select('booking_date, total_amount')
      .eq('facility_id', facilityId)
      .eq('status', 'confirmed')
      .order('booking_date');

    if (dateFilter) {
      query = query.gte('booking_date', dateFilter);
    }

    const { data } = await query;

    if (data) {
      const grouped = data.reduce((acc, booking) => {
        const date = booking.booking_date;
        if (!acc[date]) {
          acc[date] = { date, bookings: 0, revenue: 0 };
        }
        acc[date].bookings += 1;
        acc[date].revenue += Number(booking.total_amount || 0);
        return acc;
      }, {} as Record<string, BookingTrend>);

      setBookingTrends(Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)));
    }
  }

  async function loadCourtUtilization(facilityId: string) {
    const dateFilter = getDateFilter();
    let query = supabase
      .from('bookings')
      .select('court_id, duration_hours, courts(name)')
      .eq('facility_id', facilityId)
      .eq('status', 'confirmed');

    if (dateFilter) {
      query = query.gte('booking_date', dateFilter);
    }

    const { data } = await query;

    if (data) {
      const courtStats = data.reduce((acc, booking) => {
        const courtName = (booking.courts as any)?.name || 'Unknown';
        if (!acc[courtName]) {
          acc[courtName] = { court_name: courtName, total_bookings: 0, total_hours: 0, utilization_rate: 0 };
        }
        acc[courtName].total_bookings += 1;
        acc[courtName].total_hours += Number(booking.duration_hours || 0);
        return acc;
      }, {} as Record<string, CourtUtilization>);

      const daysInRange = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
      const maxHours = daysInRange * 16;

      Object.values(courtStats).forEach(court => {
        court.utilization_rate = Math.round((court.total_hours / maxHours) * 100);
      });

      setCourtUtilization(Object.values(courtStats).sort((a, b) => b.total_hours - a.total_hours));
    }
  }

  async function loadPeakHours(facilityId: string) {
    const dateFilter = getDateFilter();
    let query = supabase
      .from('bookings')
      .select('start_time')
      .eq('facility_id', facilityId)
      .eq('status', 'confirmed');

    if (dateFilter) {
      query = query.gte('booking_date', dateFilter);
    }

    const { data } = await query;

    if (data) {
      const hourCounts = data.reduce((acc, booking) => {
        const hour = booking.start_time.split(':')[0];
        const hourNum = parseInt(hour);
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
        const label = `${displayHour} ${period}`;

        if (!acc[label]) {
          acc[label] = { hour: label, bookings: 0, sortKey: hourNum };
        }
        acc[label].bookings += 1;
        return acc;
      }, {} as Record<string, PeakHour & { sortKey: number }>);

      const sorted = Object.values(hourCounts)
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(({ hour, bookings }) => ({ hour, bookings }));

      setPeakHours(sorted);
    }
  }

  async function loadAgeDemographics(facilityId: string) {
    const dateFilter = getDateFilter();
    let query = supabase
      .from('bookings')
      .select(`
        user_id,
        duration_hours,
        profiles!inner(date_of_birth)
      `)
      .eq('facility_id', facilityId)
      .eq('status', 'confirmed');

    if (dateFilter) {
      query = query.gte('booking_date', dateFilter);
    }

    const { data } = await query;

    if (data) {
      const ageGroups = data.reduce((acc, booking) => {
        const dob = (booking.profiles as any)?.date_of_birth;
        if (!dob) return acc;

        const age = new Date().getFullYear() - new Date(dob).getFullYear();
        let ageRange = '';

        if (age < 18) ageRange = 'Under 18';
        else if (age < 25) ageRange = '18-24';
        else if (age < 35) ageRange = '25-34';
        else if (age < 45) ageRange = '35-44';
        else if (age < 55) ageRange = '45-54';
        else if (age < 65) ageRange = '55-64';
        else ageRange = '65+';

        if (!acc[ageRange]) {
          acc[ageRange] = { age_range: ageRange, count: 0, total_playtime: 0, avg_playtime: 0 };
        }
        acc[ageRange].count += 1;
        acc[ageRange].total_playtime += Number(booking.duration_hours || 0);
        return acc;
      }, {} as Record<string, AgeDemographic & { total_playtime: number }>);

      Object.values(ageGroups).forEach(group => {
        group.avg_playtime = group.count > 0 ? Number((group.total_playtime / group.count).toFixed(1)) : 0;
      });

      const ageOrder = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
      setAgeDemographics(
        Object.values(ageGroups)
          .sort((a, b) => ageOrder.indexOf(a.age_range) - ageOrder.indexOf(b.age_range))
      );
    }
  }

  async function loadRevenueMetrics(facilityId: string) {
    const dateFilter = getDateFilter();
    let query = supabase
      .from('bookings')
      .select('total_amount, duration_hours')
      .eq('facility_id', facilityId)
      .eq('status', 'confirmed');

    if (dateFilter) {
      query = query.gte('booking_date', dateFilter);
    }

    const { data } = await query;

    if (data && data.length > 0) {
      const totalRevenue = data.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
      const totalHours = data.reduce((sum, b) => sum + Number(b.duration_hours || 0), 0);

      setRevenueMetrics({
        total_revenue: totalRevenue,
        total_bookings: data.length,
        avg_booking_value: data.length > 0 ? totalRevenue / data.length : 0,
        total_hours_booked: totalHours
      });
    }
  }

  async function exportToCSV() {
    const csv = [
      ['Date', 'Bookings', 'Revenue'],
      ...bookingTrends.map(t => [t.date, t.bookings, t.revenue.toFixed(2)])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!facilityId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">You need to be associated with a facility to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your facility performance</p>
        </div>

        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${revenueMetrics.total_revenue.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {revenueMetrics.total_bookings}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Booking Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${revenueMetrics.avg_booking_value.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hours Booked</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {revenueMetrics.total_hours_booked.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Booking Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={bookingTrends}>
              <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="bookings"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorBookings)"
                name="Bookings"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Revenue Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bookingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Revenue ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Court Utilization
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courtUtilization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="court_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_bookings" fill="#10b981" name="Bookings" />
              <Bar dataKey="utilization_rate" fill="#3b82f6" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Peak Hours
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#f59e0b" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Age Demographics
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ageDemographics}
                dataKey="count"
                nameKey="age_range"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.age_range}: ${entry.count}`}
              >
                {ageDemographics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Average Playtime by Age
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageDemographics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age_range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg_playtime" fill="#8b5cf6" name="Avg Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Court Performance Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Court</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Bookings</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Hours</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Utilization Rate</th>
              </tr>
            </thead>
            <tbody>
              {courtUtilization.map((court, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{court.court_name}</td>
                  <td className="py-3 px-4 text-right">{court.total_bookings}</td>
                  <td className="py-3 px-4 text-right">{court.total_hours.toFixed(1)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                      court.utilization_rate >= 70 ? 'bg-green-100 text-green-800' :
                      court.utilization_rate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {court.utilization_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
