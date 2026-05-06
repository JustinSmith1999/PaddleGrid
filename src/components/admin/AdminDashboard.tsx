import { useEffect, useState } from 'react';
import {
  Loader2, X, User, Mail, Phone, Calendar, Clock, DollarSign,
  MapPin, UserPlus, TrendingUp, TrendingDown, Users, BarChart3,
  ArrowUpRight, ArrowDownRight, Activity, Zap, Target, CalendarDays
} from 'lucide-react';
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
        supabase.from('court_availability_blocks').select('id, block_date, start_time, end_time, block_type, notes, courts(name), created_at').eq('block_type', 'reservation').order('created_at', { ascending: false }).limit(8),
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

          if (!preMembershipsResult.error) {
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
      for (let hour = 6; hour <= 22; hour++) {
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
      <div className="flex flex-col justify-center items-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
        <p className="text-sm text-slate-500">Loading dashboard...</p>
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
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
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
      setNewMemberForm({ email: '', password: '', fullName: '', phone: '', skillLevel: '' });
      await fetchStats();
      alert('Member added successfully!');
    } catch (error: any) {
      console.error('Error adding member:', error);
      alert(error.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const maxBookings = Math.max(...todaySchedule.map(s => s.bookings), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-700" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3" />
              This month
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">${stats.monthRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-sm text-slate-500 mt-1">Monthly Revenue</p>
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-400">7-day: ${stats.weekRevenue.toFixed(0)}</span>
            <span className="text-xs text-slate-400">All-time: ${stats.totalRevenue.toFixed(0)}</span>
          </div>
        </div>

        {/* Bookings Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-teal-600" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
              <Activity className="w-3 h-3" />
              Today: {stats.todayBookings}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalBookings}</p>
          <p className="text-sm text-slate-500 mt-1">Total Bookings (30d)</p>
          {stats.pendingBookings > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-50">
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                {stats.pendingBookings} pending approval
              </span>
            </div>
          )}
        </div>

        {/* Members Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-600" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3" />
              +{stats.newMembersThisMonth}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.activeUsers}</p>
          <p className="text-sm text-slate-500 mt-1">Active Members</p>
          <div className="mt-3 pt-3 border-t border-slate-50">
            <span className="text-xs text-slate-400">{stats.newMembersThisMonth} joined this month</span>
          </div>
        </div>

        {/* Utilization Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
              stats.courtUtilization > 60 ? 'text-emerald-600 bg-emerald-50' :
              stats.courtUtilization > 30 ? 'text-amber-600 bg-amber-50' :
              'text-red-600 bg-red-50'
            }`}>
              {stats.courtUtilization > 60 ? 'High' : stats.courtUtilization > 30 ? 'Medium' : 'Low'}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.courtUtilization.toFixed(0)}%</p>
          <p className="text-sm text-slate-500 mt-1">Court Utilization</p>
          <div className="mt-3 pt-3 border-t border-slate-50">
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  stats.courtUtilization > 60 ? 'bg-emerald-500' :
                  stats.courtUtilization > 30 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(stats.courtUtilization, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Adoption Score Banner */}
      {stats.totalPreRegistered > 0 && (
        <div className="bg-gradient-to-r from-green-700 via-green-800 to-emerald-700 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-green-200" />
                <h3 className="text-sm font-semibold text-green-100 uppercase tracking-wide">Platform Adoption</h3>
              </div>
              <p className="text-white text-sm opacity-90">
                {stats.claimedPreRegistered} of {stats.totalPreRegistered} CourtReserve members migrated
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white">{stats.adoptionRate}%</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-700"
                style={{ width: `${stats.adoptionRate}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Heatmap - Spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Today's Court Activity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Hourly booking density</p>
            </div>
            <button
              onClick={() => onViewChange('schedule')}
              className="text-xs font-medium text-green-700 hover:text-green-800 transition-colors"
            >
              View Schedule →
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-end gap-1.5 h-40">
              {todaySchedule.map((slot) => {
                const height = slot.bookings > 0 ? Math.max((slot.bookings / maxBookings) * 100, 12) : 4;
                const intensity = slot.bookings === 0 ? 'bg-slate-100' :
                  slot.bookings >= maxBookings * 0.75 ? 'bg-green-700' :
                  slot.bookings >= maxBookings * 0.5 ? 'bg-green-500' :
                  slot.bookings >= maxBookings * 0.25 ? 'bg-green-400' :
                  'bg-green-300';

                return (
                  <div key={slot.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {slot.hour} · {slot.bookings} {slot.bookings === 1 ? 'booking' : 'bookings'}
                    </div>
                    <div
                      className={`w-full rounded-md transition-all duration-300 ${intensity} group-hover:opacity-80`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[9px] text-slate-400 mt-1">
                      {parseInt(slot.hour) % 2 === 0 ? slot.hour.replace(':00', '') : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-100" />
                <span className="text-[10px] text-slate-400">Empty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-green-300" />
                <span className="text-[10px] text-slate-400">Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span className="text-[10px] text-slate-400">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-green-700" />
                <span className="text-[10px] text-slate-400">High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Quick Actions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Common tasks</p>
          </div>
          <div className="p-4 space-y-2">
            <button
              onClick={() => onViewChange('schedule')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <Calendar className="w-4 h-4 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Court Schedule</p>
                <p className="text-xs text-slate-500">View availability</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 transition-colors" />
            </button>

            <button
              onClick={() => onViewChange('bookings')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                <CalendarDays className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Reservations</p>
                <p className="text-xs text-slate-500">Manage bookings</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
            </button>

            <button
              onClick={() => onViewChange('members')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                <Users className="w-4 h-4 text-sky-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Members</p>
                <p className="text-xs text-slate-500">Search & manage</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-sky-400 transition-colors" />
            </button>

            <button
              onClick={() => onViewChange('analytics')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Analytics</p>
                <p className="text-xs text-slate-500">Reports & insights</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 transition-colors" />
            </button>

            <button
              onClick={() => onViewChange('series')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Events & Leagues</p>
                <p className="text-xs text-slate-500">Series management</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Bookings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest activity across all courts</p>
          </div>
          <button
            onClick={() => onViewChange('bookings')}
            className="text-xs font-medium text-green-700 hover:text-green-800 transition-colors"
          >
            View All →
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {recentBookings.length > 0 ? (
            recentBookings.map((booking) => (
              <button
                key={booking.id}
                onClick={() => fetchBookingDetails(booking.id)}
                className="w-full px-6 py-4 hover:bg-slate-50/50 transition-colors text-left flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">{booking.court_name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{booking.player_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-slate-700">{formatDate(booking.start_time)}</p>
                  <p className="text-[10px] text-slate-400">{formatTime(booking.start_time)}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No recent bookings</p>
            </div>
          )}
        </div>
      </div>

      {/* DUPR Stats (if data exists) */}
      {stats.totalDuprMatches > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">DUPR Matches</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{stats.totalDuprMatches}</p>
            {stats.pendingDuprMatches > 0 && (
              <p className="text-xs text-amber-600 mt-1">{stats.pendingDuprMatches} pending</p>
            )}
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Rating</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{stats.averageDuprRating.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending Review</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{stats.pendingDuprMatches}</p>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg font-semibold text-slate-900">Booking Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {loadingBooking ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 text-green-700 animate-spin" />
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Player</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">{selectedBooking.player.full_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{selectedBooking.player.email}</span>
                    </div>
                    {selectedBooking.player.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{selectedBooking.player.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Reservation</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-sm font-medium text-slate-900">{selectedBooking.court.name}</span>
                        <span className="text-xs text-slate-500 ml-2">{selectedBooking.court.surface_type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {new Date(selectedBooking.start_time).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {formatTime(selectedBooking.start_time)} – {formatTime(selectedBooking.end_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">${selectedBooking.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                  <button className="flex-1 px-4 py-2.5 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-colors text-sm font-medium">
                    Contact Player
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-green-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Add Member</h3>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={newMemberForm.fullName}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-colors text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-colors text-sm"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={newMemberForm.password}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-colors text-sm"
                  placeholder="Min. 6 characters"
                  minLength={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-colors text-sm"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Skill Level</label>
                  <select
                    value={newMemberForm.skillLevel}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, skillLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-colors text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Professional">Pro</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                  disabled={addingMember}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-colors text-sm font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
