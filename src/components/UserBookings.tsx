import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'completed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700';
      case 'pending':
        return 'bg-amber-50 text-amber-700';
      case 'refunded':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-600';
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {paymentSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-green-900 font-semibold mb-1">Payment Successful!</h3>
            <p className="text-green-700 text-sm">Your booking has been confirmed and payment processed successfully.</p>
          </div>
          <button
            onClick={() => setPaymentSuccess(false)}
            className="text-green-600 hover:text-green-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      {/* Header with Controls */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              My Bookings
            </h2>
            <p className="text-slate-500 mt-1 text-sm">{filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none w-full sm:w-64 bg-slate-50 text-slate-900 placeholder-slate-400 transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none bg-slate-50 text-slate-700 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-colors flex items-center gap-2 font-semibold text-sm shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </motion.div>

      {/* Spreadsheet Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>No bookings found</h3>
            <p className="text-slate-500 text-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Book a court to get started!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => handleSort('booking_date')}
                  >
                    <div className="flex items-center gap-2">
                      Date {getSortIcon('booking_date')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => handleSort('courts')}
                  >
                    <div className="flex items-center gap-2">
                      Court {getSortIcon('courts')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => handleSort('duration_hours')}
                  >
                    <div className="flex items-center gap-2">
                      Duration {getSortIcon('duration_hours')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => handleSort('total_amount')}
                  >
                    <div className="flex items-center gap-2">
                      Amount {getSortIcon('total_amount')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status {getSortIcon('status')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => handleSort('payment_status')}
                  >
                    <div className="flex items-center gap-2">
                      Payment {getSortIcon('payment_status')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((booking, index) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                      {booking.courts.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {booking.duration_hours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                      ${booking.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${getPaymentStatusColor(booking.payment_status)}`}>
                        {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                      {booking.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="border border-red-200 text-red-600 rounded-xl hover:bg-red-50 px-3 py-1.5 font-medium text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
