import { useEffect, useState } from 'react';
import DemoTour from '../DemoTour';
import InsightsCard from './InsightsCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, X, User, Mail, Phone, Calendar, Clock, DollarSign,
  MapPin, UserPlus, TrendingUp, TrendingDown, Users, BarChart3,
  ArrowUpRight, ArrowDownRight, Activity, Zap, Target, CalendarDays,
  ChevronRight
} from 'lucide-react';
import { supabase, fetchAllRows } from '../../lib/supabase';
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

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalContent = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    transition: { duration: 0.15 },
  },
};

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

      // fetchAllRows imported from ../../lib/supabase to bypass 1000-row limit

      const [
        bookingsResult,
        usersResult,
        todayBookingsResult,
        courtsResult,
        todayCourtsResult,
        recentBlocksResult,
        newMembersResult
      ] = await Promise.all([
        supabase.from('court_availability_blocks').select('*', { count: 'exact', head: true }).eq('block_type', 'reservation').gte('block_date', monthAgoDateStr),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('court_availability_blocks').select('*', { count: 'exact', head: true }).eq('block_type', 'reservation').eq('block_date', todayDateStr),
        supabase.from('courts').select('*', { count: 'exact', head: true }),
        supabase.from('court_availability_blocks').select('court_id').eq('block_type', 'reservation').eq('block_date', todayDateStr).limit(5000),
        supabase.from('court_availability_blocks').select('id, block_date, start_time, end_time, block_type, notes, courts(name), created_at').eq('block_type', 'reservation').order('created_at', { ascending: false }).limit(8),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthAgoTimestamp)
      ]);

      // Fetch revenue data with pagination to avoid Supabase 1000-row default limit
      const [allReservationsData, weekReservationsData, monthReservationsData, todayReservationsData] = await Promise.all([
        fetchAllRows(() => supabase.from('court_availability_blocks').select('start_time, end_time, courts(hourly_rate)').eq('block_type', 'reservation')),
        fetchAllRows(() => supabase.from('court_availability_blocks').select('start_time, end_time, courts(hourly_rate)').eq('block_type', 'reservation').gte('block_date', weekAgoDateStr)),
        fetchAllRows(() => supabase.from('court_availability_blocks').select('start_time, end_time, courts(hourly_rate)').eq('block_type', 'reservation').gte('block_date', monthAgoDateStr)),
        fetchAllRows(() => supabase.from('court_availability_blocks').select('start_time, end_time, courts(hourly_rate)').eq('block_type', 'reservation').eq('block_date', todayDateStr)),
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

      const totalRevenue = calculateRevenue(allReservationsData);
      const weekRevenue = calculateRevenue(weekReservationsData);
      const monthRevenue = calculateRevenue(monthReservationsData);

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
          const claimedResult = await supabase
            .from('pre_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('facility_id', profile.facility_id)
            .eq('claimed', true);

          preRegisteredClaimed = claimedResult.count || 0;
          adoptionRate = Math.round((preRegisteredClaimed / preRegisteredTotal) * 100);
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
      <>
        <DemoTour />
        <InsightsCard />
        <div className="flex flex-col justify-center items-center py-24 gap-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </>
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

  const kpiCards = [
    {
      icon: DollarSign,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-700',
      badgeText: 'This month',
      badgeIcon: ArrowUpRight,
      badgeColor: 'text-emerald-600 bg-emerald-50',
      metric: `$${stats.monthRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      label: 'Monthly Revenue',
      subLeft: `7-day: $${Math.round(stats.weekRevenue).toLocaleString()}`,
      subRight: `All-time: $${Math.round(stats.totalRevenue).toLocaleString()}`,
    },
    {
      icon: CalendarDays,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      badgeText: `Today: ${stats.todayBookings}`,
      badgeIcon: Activity,
      badgeColor: 'text-teal-600 bg-teal-50',
      metric: `${stats.totalBookings}`,
      label: 'Total Bookings (30d)',
      subLeft: stats.pendingBookings > 0 ? `${stats.pendingBookings} pending` : undefined,
      subRight: undefined,
    },
    {
      icon: Users,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      badgeText: `+${stats.newMembersThisMonth}`,
      badgeIcon: ArrowUpRight,
      badgeColor: 'text-emerald-600 bg-emerald-50',
      metric: `${stats.activeUsers}`,
      label: 'Active Members',
      subLeft: `${stats.newMembersThisMonth} joined this month`,
      subRight: undefined,
    },
    {
      icon: Target,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      badgeText: stats.courtUtilization > 60 ? 'High' : stats.courtUtilization > 30 ? 'Medium' : 'Low',
      badgeIcon: undefined,
      badgeColor: stats.courtUtilization > 60 ? 'text-emerald-600 bg-emerald-50' : stats.courtUtilization > 30 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50',
      metric: `${stats.courtUtilization.toFixed(0)}%`,
      label: 'Court Utilization',
      isUtilization: true,
    },
  ];

  const quickActions = [
    { icon: Calendar, iconBg: 'bg-green-50', iconHover: 'group-hover:bg-green-100', iconColor: 'text-green-700', arrowHover: 'group-hover:text-green-600', title: 'Court Schedule', desc: 'View availability', view: 'schedule' },
    { icon: CalendarDays, iconBg: 'bg-teal-50', iconHover: 'group-hover:bg-teal-100', iconColor: 'text-teal-600', arrowHover: 'group-hover:text-teal-500', title: 'Reservations', desc: 'Manage bookings', view: 'bookings' },
    { icon: Users, iconBg: 'bg-sky-50', iconHover: 'group-hover:bg-sky-100', iconColor: 'text-sky-600', arrowHover: 'group-hover:text-sky-500', title: 'Members', desc: 'Search & manage', view: 'members' },
    { icon: BarChart3, iconBg: 'bg-emerald-50', iconHover: 'group-hover:bg-emerald-100', iconColor: 'text-emerald-600', arrowHover: 'group-hover:text-emerald-500', title: 'Analytics', desc: 'Reports & insights', view: 'analytics' },
    { icon: Zap, iconBg: 'bg-amber-50', iconHover: 'group-hover:bg-amber-100', iconColor: 'text-amber-600', arrowHover: 'group-hover:text-amber-500', title: 'Events & Leagues', desc: 'Series management', view: 'series' },
  ];

  return (
    <div className="space-y-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <DemoTour />
      <InsightsCard />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Welcome back. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(21, 128, 61, 0.2)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddMemberModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
            className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow cursor-default"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-[44px] h-[44px] rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${card.badgeColor}`}>
                {card.badgeIcon && <card.badgeIcon className="w-3 h-3" />}
                {card.badgeText}
              </span>
            </div>
            <p className="text-[28px] font-bold text-slate-900 leading-tight">{card.metric}</p>
            <p className="text-sm text-slate-500 mt-1">{card.label}</p>

            {'isUtilization' in card && card.isUtilization ? (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(stats.courtUtilization, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                    className={`h-2 rounded-full ${
                      stats.courtUtilization > 60 ? 'bg-emerald-500' :
                      stats.courtUtilization > 30 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            ) : (card.subLeft || card.subRight) ? (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                {card.subLeft && <span className="text-xs text-slate-400">{card.subLeft}</span>}
                {card.subRight && <span className="text-xs text-slate-400">{card.subRight}</span>}
              </div>
            ) : null}
          </motion.div>
        ))}
      </div>

      {/* Adoption Score Banner */}
      {stats.totalPreRegistered > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 rounded-2xl p-8 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-100" />
                </div>
                <h3 className="text-sm font-bold text-green-100 uppercase tracking-wider">Platform Adoption</h3>
              </div>
              <p className="text-white/90 text-base leading-relaxed">
                <span className="font-semibold text-white">{stats.claimedPreRegistered.toLocaleString()}</span> of{' '}
                <span className="font-semibold text-white">{stats.totalPreRegistered.toLocaleString()}</span> CourtReserve members migrated
              </p>
            </div>
            <div className="text-right pl-8">
              <div className="text-5xl font-bold text-white tracking-tight">
                {stats.adoptionRate}%
              </div>
              <p className="text-green-200 text-xs font-medium mt-1 uppercase tracking-wide">Adoption Rate</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full bg-white/20 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.adoptionRate}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                className="bg-white rounded-full h-3"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Court Activity - Spans 2 cols */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Today's Court Activity
              </h3>
              <p className="text-xs text-slate-400 mt-1">Hourly booking density</p>
            </div>
            <button
              onClick={() => onViewChange('schedule')}
              className="text-xs font-semibold text-green-700 hover:text-green-800 transition-colors flex items-center gap-1"
            >
              View Schedule
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-7">
            <div className="flex items-end gap-2 h-44">
              {todaySchedule.map((slot, idx) => {
                const height = slot.bookings > 0 ? Math.max((slot.bookings / maxBookings) * 100, 12) : 4;
                const intensity = slot.bookings === 0 ? 'bg-slate-100' :
                  slot.bookings >= maxBookings * 0.75 ? 'bg-green-700' :
                  slot.bookings >= maxBookings * 0.5 ? 'bg-green-500' :
                  slot.bookings >= maxBookings * 0.25 ? 'bg-green-400' :
                  'bg-green-300';

                return (
                        <motion.div
                    key={slot.hour}
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    className="flex-1 h-full flex flex-col items-center gap-1 group relative"
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                      {slot.hour} - {slot.bookings} {slot.bookings === 1 ? 'booking' : 'bookings'}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-900" />
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.02, ease: 'easeOut' }}
                      className={`w-full rounded-lg transition-colors ${intensity} group-hover:opacity-80`}
                    />
                    <span className="text-[9px] text-slate-400 mt-1.5 font-medium">
                      {parseInt(slot.hour) % 2 === 0 ? slot.hour.replace(':00', '') : ''}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex items-center gap-6 mt-5 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-slate-100" />
                <span className="text-[11px] text-slate-400 font-medium">Empty</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-300" />
                <span className="text-[11px] text-slate-400 font-medium">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-[11px] text-slate-400 font-medium">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-700" />
                <span className="text-[11px] text-slate-400 font-medium">High</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div className="px-7 py-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">
              Quick Actions
            </h3>
            <p className="text-xs text-slate-400 mt-1">Common tasks</p>
          </div>
          <div className="divide-y divide-slate-100">
            {quickActions.map((action) => (
              <motion.button
                key={action.view}
                whileHover={{ x: 2, backgroundColor: 'rgb(248, 250, 252)' }}
                onClick={() => onViewChange(action.view)}
                className="w-full flex items-center gap-4 px-7 py-4 transition-colors text-left group"
              >
                <div className={`w-10 h-10 rounded-xl ${action.iconBg} ${action.iconHover} flex items-center justify-center transition-colors flex-shrink-0`}>
                  <action.icon className={`w-[18px] h-[18px] ${action.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-300 ${action.arrowHover} transition-all group-hover:translate-x-0.5`} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Recent Bookings
            </h3>
            <p className="text-xs text-slate-400 mt-1">Latest activity across all courts</p>
          </div>
          <button
            onClick={() => onViewChange('bookings')}
            className="text-xs font-semibold text-green-700 hover:text-green-800 transition-colors flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {recentBookings.length > 0 ? (
            recentBookings.map((booking, idx) => (
              <motion.button
                key={booking.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                onClick={() => fetchBookingDetails(booking.id)}
                className="w-full px-7 py-4 transition-colors text-left flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-green-700">
                    {booking.player_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="text-sm font-semibold text-slate-900 truncate">{booking.court_name}</p>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{booking.player_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-slate-700">{formatDate(booking.start_time)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatTime(booking.start_time)}</p>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="px-7 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No recent bookings</p>
              <p className="text-xs text-slate-400 mt-1">Activity will show up here once bookings come in.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* DUPR Stats (if data exists) */}
      {stats.totalDuprMatches > 0 && (
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Activity, label: 'DUPR Matches', value: stats.totalDuprMatches, sub: stats.pendingDuprMatches > 0 ? `${stats.pendingDuprMatches} pending` : undefined },
            { icon: TrendingUp, label: 'Avg Rating', value: stats.averageDuprRating.toFixed(2), sub: undefined },
            { icon: Clock, label: 'Pending Review', value: stats.pendingDuprMatches, sub: undefined },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
              className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-[44px] h-[44px] rounded-xl bg-orange-50 flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
              </div>
              <p className="text-[22px] font-bold text-slate-900">{card.value}</p>
              {card.sub && (
                <p className="text-xs text-amber-600 font-medium mt-1.5">{card.sub}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            key="booking-overlay"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalOverlay}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              key="booking-modal"
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 px-7 py-5 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-lg font-bold text-slate-900">
                  Booking Details
                </h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {loadingBooking ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-6 h-6 text-green-700 animate-spin" />
                </div>
              ) : (
                <div className="p-7 space-y-5">
                  <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Player</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{selectedBooking.player.full_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-sm text-slate-600">{selectedBooking.player.email}</span>
                      </div>
                      {selectedBooking.player.phone && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <span className="text-sm text-slate-600">{selectedBooking.player.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Reservation</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-900">{selectedBooking.court.name}</span>
                          <span className="text-xs text-slate-400 ml-2">{selectedBooking.court.surface_type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-sm text-slate-600">
                          {new Date(selectedBooking.start_time).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-sm text-slate-600">
                          {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">${selectedBooking.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold"
                    >
                      Close
                    </button>
                    <button className="flex-1 px-4 py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-colors text-sm font-semibold shadow-sm">
                      Contact Player
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <motion.div
            key="member-overlay"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalOverlay}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddMemberModal(false)}
          >
            <motion.div
              key="member-modal"
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
            >
              <div className="border-b border-slate-100 px-7 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-green-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Add Member
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="p-7 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.fullName}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-sm bg-slate-50/50 focus:bg-white"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-sm bg-slate-50/50 focus:bg-white"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                  <input
                    type="password"
                    required
                    value={newMemberForm.password}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-sm bg-slate-50/50 focus:bg-white"
                    placeholder="Min. 6 characters"
                    minLength={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newMemberForm.phone}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-sm bg-slate-50/50 focus:bg-white"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Skill Level</label>
                    <select
                      value={newMemberForm.skillLevel}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, skillLevel: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-sm bg-slate-50/50 focus:bg-white"
                    >
                      <option value="">Select...</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Professional">Pro</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold"
                    disabled={addingMember}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-colors text-sm font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
