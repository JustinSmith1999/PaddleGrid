import { useEffect, useState } from 'react';
import { Loader2, X, User, Mail, Phone, Calendar, Clock, DollarSign, MapPin, UserPlus, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  pendingBookings: number;
  todayBookings: number;
  weekRevenue: number;
  monthRevenue: number;
  courtUtilization: number;
  newMembersThisMonth: number;
  pendingDuprMatches: number;
  totalDuprMatches: number;
  averageDuprRating: number;
  totalPreRegistered: number;
  claimedPreRegistered: number;
  adoptionRate: number;
}

interface RecentBooking {
  id: string;
  court_name: string;
  player_name: string;
  start_time: string;
  status: string;
}

interface BookingDetail {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  court: {
    name: string;
    surface_type: string;
  };
  player: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    skill_level: string;
    created_at: string;
  };
}

interface TodaySchedule {
  hour: string;
  bookings: number;
  revenue: number;
}

interface AdminDashboardProps {
  onViewChange: (view: string) => void;
}

export function AdminDashboard({ onViewChange }: AdminDashboardProps) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingBookings: 0,
    todayBookings: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    courtUtilization: 0,
    newMembersThisMonth: 0,
    pendingDuprMatches: 0,
    totalDuprMatches: 0,
    averageDuprRating: 0,
    totalPreRegistered: 0,
    claimedPreRegistered: 0,
    adoptionRate: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    skillLevel: ''
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      const todayDateStr = today.toISOString().split('T')[0];

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoDateStr = weekAgo.toISOString().split('T')[0];

      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthAgoDateStr = monthAgo.toISOString().split('T')[0];
      const monthAgoTimestamp = monthAgo.toISOString();

      const [
        bookingsResult,
        usersResult,
        allReservationsWithCourts,
        todayBookingsResult,
        todayReservationsWithCourts,
        weekReservationsWithCourts,
        monthReservationsWithCourts,
        courtsResult,
        todayCourtsResult,
        recentBlocksResult,
        newMembersResult
      ] = await Promise.all([
        supabase.from('court_availability_blocks').select('*', { count: 'exact', head: true }).eq('block_type', 'reservation').gte('block_date', monthAgoDateStr),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('court_availability_blocks').select('start_time, end_time, courts(hourly_rate)').eq('block_type', 'reservation'),
        supabase.from('court_availability_blocks').select('*', { count: 'exact', head: true }).eq('block_type', 'reservation').eq('block_date', todayDateStr),
        supabase.from('court_availability_blocks').select('start_time, end_time, courts(hourly_rate)').eq('block_type', 'reservation').eq('block_date', todayDateStr),
        supabase.from('court_availability_blocks').select('start_time, end_time, courts(hourly_rate)').eq('block_type', 'reservation').gte('block_date', weekAgoDateStr),
        supabase.from('court_availability_blocks').select('start_time, end_time, courts(hourly_rate)').eq('block_type', 'reservation').gte('block_date', monthAgoDateStr),
        supabase.from('courts').select('*', { count: 'exact', head: true }),
        supabase.from('court_availability_blocks').select('court_id').eq('block_type', 'reservation').eq('block_date', todayDateStr),
        supabase.from('court_availability_blocks').select('id, block_date, start_time, end_time, block_type, notes, courts(name), created_at').eq('block_type', 'reservation').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthAgoTimestamp)
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

      const totalRevenue = calculateRevenue(allReservationsWithCourts.data || []);
      const todayRevenue = calculateRevenue(todayReservationsWithCourts.data || []);
      const weekRevenue = calculateRevenue(weekReservationsWithCourts.data || []);
      const monthRevenue = calculateRevenue(monthReservationsWithCourts.data || []);

      const totalCourts = courtsResult.count || 1;
      const uniqueCourtsToday = new Set(todayCourtsResult.data?.map((b: any) => b.court_id)).size;
      const courtUtilization = totalCourts > 0 ? (uniqueCourtsToday / totalCourts) * 100 : 0;

      const recent = recentBlocksResult.data?.map((block: any) => ({
        id: block.id,
        court_name: block.courts?.name || 'Unknown Court',
        player_name: block.notes || 'Reserved',
        start_time: `${block.block_date}T${block.start_time}`,
        status: 'confirmed'
      })) || [];

      setRecentBookings(recent);

      const [duprPendingResult, duprTotalResult, duprRatingsResult] = await Promise.all([
        supabase.from('dupr_matches').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('dupr_matches').select('*', { count: 'exact', head: true }),
        supabase.from('player_stats').select('dupr_rating').not('dupr_rating', 'is', null)
      ]);

      const avgRating = duprRatingsResult.data && duprRatingsResult.data.length > 0
        ? duprRatingsResult.data.reduce((sum, p) => sum + Number(p.dupr_rating), 0) / duprRatingsResult.data.length
        : 0;

      let preRegisteredTotal = 0;
      let preRegisteredClaimed = 0;
      let adoptionRate = 0;

      if (profile?.facility_id) {
        const totalPreMembershipsResult = await supabase
          .from('pre_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('facility_id', profile.facility_id);

        preRegisteredTotal = totalPreMembershipsResult.count || 0;

        if (preRegisteredTotal > 0) {
          const preMembershipsResult = await supabase
            .from('pre_memberships')
            .select('claimed')
            .eq('facility_id', profile.facility_id);

          if (preMembershipsResult.error) {
            console.error('Error fetching pre-memberships:', preMembershipsResult.error);
          } else {
            preRegisteredClaimed = preMembershipsResult.data?.filter(m => m.claimed === true).length || 0;
            adoptionRate = Math.round((preRegisteredClaimed / preRegisteredTotal) * 100);
          }
        }
      }

      setStats({
        totalBookings: bookingsResult.count || 0,
        totalRevenue,
        activeUsers: usersResult.count || 0,
        pendingBookings: 0,
        todayBookings: todayBookingsResult.count || 0,
        weekRevenue,
        monthRevenue,
        courtUtilization,
        newMembersThisMonth: newMembersResult.count || 0,
        pendingDuprMatches: duprPendingResult.count || 0,
        totalDuprMatches: duprTotalResult.count || 0,
        averageDuprRating: avgRating,
        totalPreRegistered: preRegisteredTotal,
        claimedPreRegistered: preRegisteredClaimed,
        adoptionRate,
      });

      const scheduleData: TodaySchedule[] = [];
      for (let hour = 8; hour <= 20; hour++) {
        const hourStart = `${String(hour).padStart(2, '0')}:00:00`;
        const hourEnd = `${String(hour + 1).padStart(2, '0')}:00:00`;

        const { data: hourBlocks } = await supabase
          .from('court_availability_blocks')
          .select('id, start_time, end_time')
          .eq('block_type', 'reservation')
          .eq('block_date', todayDateStr)
          .gte('start_time', hourStart)
          .lt('start_time', hourEnd);

        scheduleData.push({
          hour: `${hour}:00`,
          bookings: hourBlocks?.length || 0,
          revenue: 0
        });
      }
      setTodaySchedule(scheduleData);

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-stone-100 text-stone-700 border-stone-200';
      case 'cancelled':
        return 'bg-stone-100 text-stone-700 border-stone-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const fetchBookingDetails = async (bookingId: string) => {
    setLoadingBooking(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          status,
          total_amount,
          courts (
            name,
            surface_type
          ),
          profiles (
            id,
            full_name,
            email,
            phone,
            skill_level,
            created_at
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      setSelectedBooking({
        id: data.id,
        start_time: data.start_time,
        end_time: data.end_time,
        status: data.status,
        total_amount: data.total_amount,
        court: data.courts,
        player: data.profiles
      });
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoadingBooking(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newMemberForm.email,
        password: newMemberForm.password,
        options: {
          data: {
            full_name: newMemberForm.fullName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: newMemberForm.fullName,
            phone: newMemberForm.phone || null,
            skill_level: newMemberForm.skillLevel || null
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      setShowAddMemberModal(false);
      setNewMemberForm({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        skillLevel: ''
      });

      await fetchStats();
      alert('Member added successfully!');
    } catch (error: any) {
      console.error('Error adding member:', error);
      alert(error.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6">
        <h2 className="text-3xl font-bold text-stone-900 mb-2">Club Overview</h2>
        <p className="text-stone-600 text-base">Real-time insights into your club operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-stone-200 hover:border-emerald-300 transition-colors">
          <div className="space-y-1 mb-4">
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wide">Total Revenue</p>
            <p className="text-4xl font-bold text-stone-900">${stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="pt-4 border-t border-stone-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">This Month</span>
              <span className="text-sm font-semibold text-emerald-600">${stats.monthRevenue.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">Last 7 Days</span>
              <span className="text-sm font-semibold text-stone-700">${stats.weekRevenue.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-stone-200 hover:border-emerald-300 transition-colors">
          <div className="space-y-1 mb-4">
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wide">Total Bookings</p>
            <p className="text-4xl font-bold text-stone-900">{stats.totalBookings}</p>
          </div>
          <div className="pt-4 border-t border-stone-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">Today</span>
              <span className="text-sm font-semibold text-emerald-600">{stats.todayBookings}</span>
            </div>
            {stats.pendingBookings > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-stone-500">Pending</span>
                <span className="text-sm font-semibold text-stone-700">{stats.pendingBookings}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-stone-200 hover:border-emerald-300 transition-colors">
          <div className="space-y-1 mb-4">
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wide">Active Members</p>
            <p className="text-4xl font-bold text-stone-900">{stats.activeUsers}</p>
          </div>
          <div className="pt-4 border-t border-stone-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">New This Month</span>
              <span className="text-sm font-semibold text-emerald-600">+{stats.newMembersThisMonth}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-stone-200 hover:border-emerald-300 transition-colors">
          <div className="space-y-1 mb-4">
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wide">Court Utilization</p>
            <p className="text-4xl font-bold text-stone-900">{stats.courtUtilization.toFixed(0)}%</p>
          </div>
          <div className="pt-4 border-t border-stone-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">Status</span>
              <span className="text-sm font-semibold text-emerald-600">
                {stats.courtUtilization > 50 ? 'High' : stats.courtUtilization > 25 ? 'Medium' : 'Low'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {stats.pendingBookings > 0 && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-5">
          <h3 className="font-semibold text-stone-900 text-base mb-1">Action Required</h3>
          <p className="text-sm text-stone-700">
            You have {stats.pendingBookings} booking{stats.pendingBookings !== 1 ? 's' : ''} awaiting approval.
            Review them in the Bookings section.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-stone-200">
          <div className="px-6 py-5 border-b border-stone-200">
            <h3 className="text-xl font-bold text-stone-900">Today's Schedule</h3>
            <p className="text-sm text-stone-600 mt-1">Hourly booking activity</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {todaySchedule.filter(slot => slot.bookings > 0).length > 0 ? (
                todaySchedule.filter(slot => slot.bookings > 0).map((slot) => (
                  <div key={slot.hour} className="flex items-center justify-between py-3 px-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-base font-bold text-stone-900 w-14">{slot.hour}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-stone-700">{slot.bookings} {slot.bookings === 1 ? 'booking' : 'bookings'}</span>
                        <span className="text-stone-300">|</span>
                        <span className="text-sm font-semibold text-emerald-600">${slot.revenue.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="w-28 bg-stone-200 rounded-full h-2.5">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.min((slot.bookings / 5) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-500 text-center py-12">No bookings scheduled for today</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-stone-200">
          <div className="px-6 py-5 border-b border-stone-200">
            <h3 className="text-xl font-bold text-stone-900">Recent Activity</h3>
            <p className="text-sm text-stone-600 mt-1">Latest bookings across all courts</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => fetchBookingDetails(booking.id)}
                    className="w-full py-3 px-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="font-bold text-stone-900">{booking.court_name}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-stone-700 mb-1">{booking.player_name}</p>
                    <p className="text-xs text-stone-500">
                      {formatDate(booking.start_time)} at {formatTime(booking.start_time)}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-stone-500 text-center py-12">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-8 border border-stone-200 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
              <h3 className="text-lg sm:text-2xl font-bold text-stone-900">CourtReserve Adoption Score</h3>
            </div>
            <p className="text-stone-600 text-xs sm:text-sm">
              {stats.totalPreRegistered > 0 ? (
                <>{stats.claimedPreRegistered} of {stats.totalPreRegistered} CourtReserve members have created PaddleGrid accounts</>
              ) : (
                <>No CourtReserve members imported yet. Import members to track adoption.</>
              )}
            </p>
            <p className="text-stone-700 text-xs mt-1 font-semibold">
              Total CourtReserve Members: {stats.totalPreRegistered}
            </p>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-4xl sm:text-6xl font-bold text-emerald-600">{stats.adoptionRate}%</div>
            <div className="text-stone-600 text-xs sm:text-sm mt-1">Platform Adoption</div>
          </div>
        </div>
        <div className="mt-4 sm:mt-6">
          <div className="w-full bg-stone-200 rounded-full h-3 sm:h-4">
            <div
              className="bg-emerald-600 rounded-full h-3 sm:h-4 transition-all duration-500"
              style={{ width: `${stats.adoptionRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-emerald-600 rounded-lg p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">Quick Actions</h3>
          <p className="text-emerald-100">Common tasks to manage your club</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onViewChange('schedule')}
            className="bg-white bg-opacity-15 hover:bg-opacity-25 rounded-lg p-5 text-left transition-all group"
          >
            <h4 className="font-bold text-white text-base mb-2 group-hover:text-emerald-50 transition-colors">View Court Schedule</h4>
            <p className="text-sm text-emerald-100">Check availability and bookings</p>
          </button>
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="bg-white bg-opacity-15 hover:bg-opacity-25 rounded-lg p-5 text-left transition-all group"
          >
            <h4 className="font-bold text-white text-base mb-2 group-hover:text-emerald-50 transition-colors">Add New Member</h4>
            <p className="text-sm text-emerald-100">Register a new club member</p>
          </button>
          <button
            onClick={() => onViewChange('analytics')}
            className="bg-white bg-opacity-15 hover:bg-opacity-25 rounded-lg p-5 text-left transition-all group"
          >
            <h4 className="font-bold text-white text-base mb-2 group-hover:text-emerald-50 transition-colors">View Analytics</h4>
            <p className="text-sm text-emerald-100">Detailed reports and insights</p>
          </button>
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-stone-900">Booking Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingBooking ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="bg-stone-50 rounded-lg p-5">
                  <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Customer Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-stone-400" />
                      <div>
                        <p className="text-sm text-stone-500">Full Name</p>
                        <p className="font-semibold text-stone-900">{selectedBooking.player.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-stone-400" />
                      <div>
                        <p className="text-sm text-stone-500">Email</p>
                        <p className="font-semibold text-stone-900">{selectedBooking.player.email}</p>
                      </div>
                    </div>
                    {selectedBooking.player.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-stone-400" />
                        <div>
                          <p className="text-sm text-stone-500">Phone</p>
                          <p className="font-semibold text-stone-900">{selectedBooking.player.phone}</p>
                        </div>
                      </div>
                    )}
                    {selectedBooking.player.skill_level && (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-stone-400" />
                        <div>
                          <p className="text-sm text-stone-500">Skill Level</p>
                          <p className="font-semibold text-stone-900">{selectedBooking.player.skill_level}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-stone-400" />
                      <div>
                        <p className="text-sm text-stone-500">Member Since</p>
                        <p className="font-semibold text-stone-900">
                          {new Date(selectedBooking.player.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 rounded-lg p-5">
                  <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Booking Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-stone-400" />
                      <div>
                        <p className="text-sm text-stone-500">Court</p>
                        <p className="font-semibold text-stone-900">{selectedBooking.court.name}</p>
                        <p className="text-xs text-stone-500">{selectedBooking.court.surface_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-stone-400" />
                      <div>
                        <p className="text-sm text-stone-500">Date</p>
                        <p className="font-semibold text-stone-900">
                          {new Date(selectedBooking.start_time).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-stone-400" />
                      <div>
                        <p className="text-sm text-stone-500">Time</p>
                        <p className="font-semibold text-stone-900">
                          {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-stone-400" />
                      <div>
                        <p className="text-sm text-stone-500">Amount</p>
                        <p className="font-semibold text-stone-900">${selectedBooking.total_amount.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5" />
                      <div>
                        <p className="text-sm text-stone-500">Status</p>
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusColor(selectedBooking.status)}`}>
                          {selectedBooking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Contact Customer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xl font-bold text-stone-900">Add New Member</h3>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberForm.fullName}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={newMemberForm.password}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Min. 6 characters"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newMemberForm.phone}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Skill Level
                </label>
                <select
                  value={newMemberForm.skillLevel}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, skillLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select skill level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                  disabled={addingMember}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={addingMember}
                >
                  {addingMember ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
