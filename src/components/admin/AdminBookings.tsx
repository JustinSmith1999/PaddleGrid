import { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, DollarSign, MapPin, Loader2, User, Search, Download, X, Mail, Phone, CheckCircle2, XCircle, AlertCircle, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

type StatusTab = 'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed';

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, courts (name), profiles (full_name, email, phone)`)
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

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b =>
        b.courts?.name?.toLowerCase().includes(term) ||
        b.profiles?.full_name?.toLowerCase().includes(term) ||
        b.profiles?.email?.toLowerCase().includes(term) ||
        b.notes?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    return result;
  }, [bookings, searchTerm, statusFilter]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      if (error) throw error;
      await fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const batchUpdateStatus = async (status: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .in('id', ids);
      if (error) throw error;
      setSelectedIds(new Set());
      await fetchBookings();
    } catch (error) {
      console.error('Error batch updating:', error);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBookings.map(b => b.id)));
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed': return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" />, dot: 'bg-emerald-500' };
      case 'pending': return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertCircle className="w-3 h-3" />, dot: 'bg-amber-500' };
      case 'cancelled': return { color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" />, dot: 'bg-red-500' };
      case 'completed': return { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: <CheckCircle2 className="w-3 h-3" />, dot: 'bg-slate-400' };
      default: return { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: null, dot: 'bg-slate-400' };
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  // Stats
  const stats = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.total_amount || 0), 0);
    return { confirmed, pending, totalRevenue, total: bookings.length };
  }, [bookings]);

  const tabs: { id: StatusTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: bookings.length },
    { id: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { id: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { id: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { id: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
        <p className="text-sm text-slate-500">Loading reservations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Reservations
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {stats.total} total · ${stats.totalRevenue.toFixed(0)} revenue
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setStatusFilter(tab.id); setSelectedIds(new Set()); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              statusFilter === tab.id ? 'bg-green-50 text-green-700' : 'bg-slate-200 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Batch Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            type="text"
            placeholder="Search by player, court, or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
          />
        </div>

        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs font-medium text-slate-500">{selectedIds.size} selected</span>
            <button
              onClick={() => batchUpdateStatus('confirmed')}
              className="px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => batchUpdateStatus('cancelled')}
              className="px-3 py-2 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[40px_1fr_120px_140px_100px_80px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredBookings.length && filteredBookings.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Player / Court</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Date</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Time</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          <AnimatePresence mode="popLayout">
            {filteredBookings.map((booking, i) => {
              const statusConfig = getStatusConfig(booking.status);
              const isSelected = selectedIds.has(booking.id);

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  layout
                  className={`grid grid-cols-[40px_1fr_120px_140px_100px_80px] gap-4 px-5 py-3.5 items-center cursor-pointer transition-colors ${
                    isSelected ? 'bg-green-50/50' : 'hover:bg-slate-50/50'
                  }`}
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex items-center" onClick={e => { e.stopPropagation(); toggleSelect(booking.id); }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{booking.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400 truncate">{booking.courts?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700">{formatDate(booking.booking_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">
                      {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {booking.total_amount > 0 ? `$${booking.total_amount.toFixed(2)}` : '—'}
                    </p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border ${statusConfig.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {booking.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredBookings.length === 0 && (
            <div className="px-6 py-16 text-center">
              <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No reservations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Reservation Details</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Player */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                    {(selectedBooking.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">{selectedBooking.profiles?.full_name}</p>
                    <p className="text-xs text-slate-400">{selectedBooking.profiles?.email}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Court</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{selectedBooking.courts?.name}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Date</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{formatDate(selectedBooking.booking_date)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Time</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {formatTime(selectedBooking.start_time)} – {formatTime(selectedBooking.end_time)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Amount</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">${selectedBooking.total_amount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-500">Status</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${getStatusConfig(selectedBooking.status).color}`}>
                    {getStatusConfig(selectedBooking.status).icon}
                    {selectedBooking.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {selectedBooking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                        className="flex-1 py-2.5 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-xl transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                        className="flex-1 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {selectedBooking.status === 'confirmed' && (
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                      className="flex-1 py-2.5 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-xl transition-colors"
                    >
                      Mark Completed
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
