import { useEffect, useState } from 'react';
import { Calendar, Clock, DollarSign, MapPin, Loader2, User, Search, Download, X, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  courts: { name: string };
  profiles: { full_name: string; email: string; phone: string | null };
}

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Booking>('booking_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterAndSortBookings();
  }, [bookings, searchTerm, statusFilter, sortField, sortDirection]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
          *,
          courts (name),
          profiles (full_name, email, phone)
        `
        )
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

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.courts.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'courts') {
        aValue = a.courts.name;
        bValue = b.courts.name;
      }

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

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      await fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking status');
    }
  };

  const updatePaymentStatus = async (bookingId: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: paymentStatus })
        .eq('id', bookingId);

      if (error) throw error;
      await fetchBookings();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSortIcon = (field: keyof Booking | 'courts') => {
    if (sortField !== field && field !== 'courts') return null;
    if (field === 'courts' && sortField !== 'courts') return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Court', 'Customer', 'Email', 'Time', 'Duration', 'Amount', 'Status', 'Payment', 'Notes'];
    const csvData = [
      headers.join(','),
      ...filteredBookings.map(booking => [
        booking.booking_date,
        booking.courts.name,
        booking.profiles.full_name,
        booking.profiles.email,
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
    a.download = 'all-bookings.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
            <p className="text-gray-600 mt-1">{filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No bookings have been made yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('booking_date')}
                  >
                    <div className="flex items-center gap-2">
                      Date {getSortIcon('booking_date')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('courts')}
                  >
                    <div className="flex items-center gap-2">
                      Court {getSortIcon('courts')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('duration_hours')}
                  >
                    <div className="flex items-center gap-2">
                      Duration {getSortIcon('duration_hours')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('total_amount')}
                  >
                    <div className="flex items-center gap-2">
                      Amount {getSortIcon('total_amount')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking, index) => (
                  <tr
                    key={booking.id}
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {booking.courts.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                      >
                        {booking.profiles.full_name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {booking.duration_hours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${booking.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border cursor-pointer ${getStatusColor(booking.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={booking.payment_status}
                        onChange={(e) => updatePaymentStatus(booking.id, e.target.value)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${getPaymentStatusColor(booking.payment_status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

            <div className="p-6 space-y-6">
              <div className="bg-stone-50 rounded-lg p-5">
                <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Customer Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-stone-400" />
                    <div>
                      <p className="text-sm text-stone-500">Full Name</p>
                      <p className="font-semibold text-stone-900">{selectedBooking.profiles.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-stone-400" />
                    <div>
                      <p className="text-sm text-stone-500">Email</p>
                      <p className="font-semibold text-stone-900">{selectedBooking.profiles.email}</p>
                    </div>
                  </div>
                  {selectedBooking.profiles.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-stone-400" />
                      <div>
                        <p className="text-sm text-stone-500">Phone</p>
                        <p className="font-semibold text-stone-900">{selectedBooking.profiles.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-stone-50 rounded-lg p-5">
                <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Booking Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-stone-400" />
                    <div>
                      <p className="text-sm text-stone-500">Court</p>
                      <p className="font-semibold text-stone-900">{selectedBooking.courts.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-stone-400" />
                    <div>
                      <p className="text-sm text-stone-500">Date</p>
                      <p className="font-semibold text-stone-900">
                        {new Date(selectedBooking.booking_date).toLocaleDateString('en-US', {
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
                        {selectedBooking.start_time.slice(0, 5)} - {selectedBooking.end_time.slice(0, 5)}
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
                  {selectedBooking.notes && (
                    <div className="pt-3 border-t border-stone-200">
                      <p className="text-sm text-stone-500 mb-1">Notes</p>
                      <p className="text-stone-900">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
