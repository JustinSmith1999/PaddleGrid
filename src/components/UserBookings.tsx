import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, DollarSign, MapPin, Loader2, X, Filter, Search, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_amount: number;
  status: string;
  payment_status: string;
  notes: string | null;
  courts: {
    name: string;
  };
}

const listStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function UserBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Booking>('booking_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const bookingId = urlParams.get('booking_id');

    if (sessionId && bookingId) {
      setPaymentSuccess(true);
      window.history.replaceState({}, '', '/bookings');
      setTimeout(() => setPaymentSuccess(false), 5000);
    }
  }, [user]);

  useEffect(() => {
    filterAndSortBookings();
  }, [bookings, searchTerm, statusFilter, sortField, sortDirection]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          courts (name)
        `)
        .eq('user_id', user?.id)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBookings = () => {
    let filtered = [...bookings];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.courts.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle nested court name
      if (sortField === 'courts') {
        aValue = a.courts.name;
        bValue = b.courts.name;
      }

      // Handle date/time sorting
      if (sortField === 'booking_date') {
        aValue = new Date(a.booking_date + 'T' + a.start_time);
        bValue = new Date(b.booking_date + 'T' + b.start_time);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBookings(filtered);
  };

  const handleSort = (field: keyof Booking | 'courts') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as keyof Booking);
      setSortDirection('asc');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200/60';
      case 'cancelled':
        return 'bg-red-50 text-red-600 border border-red-200/60';
      case 'completed':
        return 'bg-slate-50 text-slate-600 border border-slate-200/60';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200/60';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200/60';
      case 'refunded':
        return 'bg-slate-50 text-slate-600 border border-slate-200/60';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200/60';
    }
  };

  const getSortIcon = (field: keyof Booking | 'courts') => {
    if (sortField !== field && field !== 'courts') return null;
    if (field === 'courts' && sortField !== 'courts') return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Court', 'Time', 'Duration', 'Amount', 'Status', 'Payment', 'Notes'];
    const csvData = [
      headers.join(','),
      ...filteredBookings.map(booking => [
        booking.booking_date,
        booking.courts.name,
        `${booking.start_time} - ${booking.end_time}`,
        `${booking.duration_hours}h`,
        `$${booking.total_amount}`,
        booking.status,
        booking.payment_status,
        booking.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-bookings.csv';
    a.click();
  };

  const statusTabs = [
    { key: 'all', label: 'All Bookings' },
    { key: 'confirmed', label: 'Upcoming' },
    { key: 'completed', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'pending', label: 'Pending' },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
          <p className="text-sm text-slate-400">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Payment success banner */}
        <AnimatePresence>
          {paymentSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 flex items-start gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-green-900 font-semibold text-sm">Payment Successful!</h3>
                <p className="text-green-700 text-sm mt-0.5">Your booking has been confirmed and payment processed successfully.</p>
              </div>
              <button
                onClick={() => setPaymentSuccess(false)}
                className="text-green-600 hover:text-green-800 p-1 rounded-lg hover:bg-green-100/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <h2
                className="text-2xl font-bold text-slate-800"
              >
                My Bookings
              </h2>
              <p className="text-slate-400 mt-1 text-sm">
                {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none w-full sm:w-64 text-slate-900 placeholder-slate-400 text-sm transition-all"
                />
              </div>

              {/* Export Button */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToCSV}
                className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 pt-1"
        >
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className="relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors"
              >
                <span className={statusFilter === tab.key ? 'text-green-700' : 'text-slate-500 hover:text-slate-700'}>
                  {tab.label}
                </span>
                {statusFilter === tab.key && (
                  <motion.div
                    layoutId="bookings-tab-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-green-700 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
        >
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <h3
                className="text-lg font-semibold text-slate-800 mb-1.5"
              >
                No bookings found
              </h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Book a court to get started!'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th
                      className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                      onClick={() => handleSort('booking_date')}
                    >
                      <div className="flex items-center gap-1.5">
                        Date {getSortIcon('booking_date')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                      onClick={() => handleSort('courts')}
                    >
                      <div className="flex items-center gap-1.5">
                        Court {getSortIcon('courts')}
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th
                      className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                      onClick={() => handleSort('duration_hours')}
                    >
                      <div className="flex items-center gap-1.5">
                        Duration {getSortIcon('duration_hours')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                      onClick={() => handleSort('total_amount')}
                    >
                      <div className="flex items-center gap-1.5">
                        Amount {getSortIcon('total_amount')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1.5">
                        Status {getSortIcon('status')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                      onClick={() => handleSort('payment_status')}
                    >
                      <div className="flex items-center gap-1.5">
                        Payment {getSortIcon('payment_status')}
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <motion.tbody
                  className="divide-y divide-slate-100"
                  variants={listStagger}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredBookings.map((booking) => (
                    <motion.tr
                      key={booking.id}
                      variants={listItem}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                        {new Date(booking.booking_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-800">{booking.courts.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {booking.duration_hours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                        ${booking.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
                          {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 max-w-[200px] truncate">
                        {booking.notes || '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {booking.status === 'pending' && (
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => cancelBooking(booking.id)}
                            className="border border-red-200/80 text-red-600 rounded-full hover:bg-red-50 px-3.5 py-1.5 font-medium text-xs transition-colors"
                          >
                            Cancel
                          </motion.button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
