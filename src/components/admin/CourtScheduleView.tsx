import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, X, ChevronLeft, ChevronRight, MapPin, User, Phone, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sortCourtsByNumber } from '../../lib/courtUtils';

interface Court {
  id: string;
  name: string;
  hourly_rate: number;
}

interface Booking {
  id: string;
  court_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  booking_date: string;
  status: string;
  total_amount: number;
  user_name?: string;
  booking_type?: string;
  player_count?: number;
  phone?: string;
  email?: string;
}

interface AvailabilityBlock {
  id: string;
  court_id: string;
  start_time: string;
  end_time: string;
  block_date: string;
  block_type: string;
  notes: string | null;
  player_count?: number;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am - 10pm

export default function CourtScheduleView() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'timeline' | 'cards'>('timeline');

  useEffect(() => {
    loadCourts();
    loadBookings();

    const subscription = supabase
      .channel('bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadBookings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'court_availability_blocks' }, () => {
        loadBookings();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedDate]);

  const loadCourts = async () => {
    const { data } = await supabase
      .from('courts')
      .select('*')
      .eq('is_active', true);
    if (data) setCourts(sortCourtsByNumber(data));
  };

  const loadBookings = async () => {
    setLoading(true);

    const [bookingsRes, blocksRes] = await Promise.all([
      supabase
        .from('bookings')
        .select(`*, profiles:user_id (full_name)`)
        .eq('booking_date', selectedDate)
        .neq('status', 'cancelled'),
      supabase
        .from('court_availability_blocks')
        .select('*')
        .eq('block_date', selectedDate)
    ]);

    if (bookingsRes.data) {
      const formatted = bookingsRes.data.map(b => ({
        ...b,
        user_name: (b.profiles as any)?.full_name || 'Unknown'
      }));
      setBookings(formatted);
    }

    if (blocksRes.data) {
      setAvailabilityBlocks(blocksRes.data);
    }

    setLoading(false);
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatHourShort = (hour: number) => {
    const ampm = hour >= 12 ? 'p' : 'a';
    const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${h}${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Get all bookings for a specific court (merge bookings + availability blocks)
  const getCourtBookings = (courtId: string): Booking[] => {
    const courtBookings = bookings.filter(b => b.court_id === courtId);
    const courtBlocks = availabilityBlocks
      .filter(b => b.court_id === courtId)
      .map(block => ({
        id: block.id,
        court_id: block.court_id,
        user_id: '',
        start_time: block.start_time,
        end_time: block.end_time,
        booking_date: block.block_date,
        status: 'confirmed',
        total_amount: 0,
        user_name: block.notes || 'Reserved',
        booking_type: block.block_type,
        player_count: block.player_count
      }));
    return [...courtBookings, ...courtBlocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getBookingColor = (booking: Booking) => {
    const type = booking.booking_type || booking.status;
    switch (type) {
      case 'reservation': return { bg: 'bg-green-600', light: 'bg-green-50', text: 'text-green-700', border: 'border-green-600' };
      case 'event': return { bg: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-600' };
      case 'tournament': return { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-600' };
      case 'lesson': return { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-500' };
      case 'maintenance': return { bg: 'bg-red-500', light: 'bg-red-50', text: 'text-red-700', border: 'border-red-500' };
      case 'pending': return { bg: 'bg-amber-400', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-400' };
      default: return { bg: 'bg-green-600', light: 'bg-green-50', text: 'text-green-700', border: 'border-green-600' };
    }
  };

  const getBookingPosition = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = (startH - 6) * 60 + startM;
    const endMinutes = (endH - 6) * 60 + endM;
    const totalMinutes = 17 * 60; // 6am to 11pm
    const top = (startMinutes / totalMinutes) * 100;
    const height = ((endMinutes - startMinutes) / totalMinutes) * 100;
    return { top: `${top}%`, height: `${Math.max(height, 2)}%` };
  };

  // Current time indicator position
  const getCurrentTimePosition = () => {
    if (!isToday) return null;
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    if (hour < 6 || hour >= 23) return null;
    const minutes = (hour - 6) * 60 + min;
    const totalMinutes = 17 * 60;
    return `${(minutes / totalMinutes) * 100}%`;
  };

  const currentTimePos = getCurrentTimePosition();

  // Stats
  const totalBookingsToday = bookings.length + availabilityBlocks.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const bookedCourts = new Set([...bookings.map(b => b.court_id), ...availabilityBlocks.map(b => b.court_id)]).size;

  if (loading && courts.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
        <p className="text-sm text-slate-500">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Court Scheduler
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {totalBookingsToday} bookings · {bookedCourts}/{courts.length} courts active
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setView('timeline')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === 'timeline' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView('cards')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === 'cards' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              Cards
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2.5 hover:bg-slate-50 transition-colors text-slate-500 rounded-l-xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-x border-slate-100"
            >
              {isToday ? 'Today' : formatDateShort(selectedDate)}
            </button>
            <button
              onClick={() => handleDateChange(1)}
              className="p-2.5 hover:bg-slate-50 transition-colors text-slate-500 rounded-r-xl"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Date Display */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-slate-700">{formatDate(selectedDate)}</span>
        {isToday && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            TODAY
          </span>
        )}
      </div>

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Court Headers */}
              <div className="flex border-b border-slate-100 sticky top-0 bg-white z-20">
                <div className="w-16 flex-shrink-0 border-r border-slate-100" />
                {courts.map(court => (
                  <div key={court.id} className="flex-1 min-w-[140px] px-3 py-3 border-r border-slate-50 last:border-r-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{court.name}</p>
                    <p className="text-[10px] text-slate-400">${court.hourly_rate}/hr</p>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="relative" style={{ height: `${HOURS.length * 64}px` }}>
                {/* Hour lines */}
                {HOURS.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-b border-slate-50 flex"
                    style={{ top: `${(i / HOURS.length) * 100}%`, height: `${100 / HOURS.length}%` }}
                  >
                    <div className="w-16 flex-shrink-0 border-r border-slate-100 flex items-start justify-end pr-2 pt-1">
                      <span className="text-[10px] font-medium text-slate-400">
                        {formatHourShort(hour)}
                      </span>
                    </div>
                    {courts.map(court => (
                      <div key={court.id} className="flex-1 min-w-[140px] border-r border-slate-50/50 last:border-r-0" />
                    ))}
                  </div>
                ))}

                {/* Current Time Line */}
                {currentTimePos && (
                  <div
                    className="absolute left-16 right-0 z-30 pointer-events-none"
                    style={{ top: currentTimePos }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                      <div className="flex-1 h-[1.5px] bg-red-500/70" />
                    </div>
                  </div>
                )}

                {/* Booking Blocks */}
                {courts.map((court, courtIndex) => {
                  const courtBookings = getCourtBookings(court.id);
                  const leftOffset = 64 + (courtIndex * ((100 - 4) / courts.length)); // approximate

                  return courtBookings.map(booking => {
                    const pos = getBookingPosition(booking.start_time, booking.end_time);
                    const color = getBookingColor(booking);
                    const courtWidth = `calc((100% - 64px) / ${courts.length})`;
                    const courtLeft = `calc(64px + ${courtIndex} * (100% - 64px) / ${courts.length})`;

                    return (
                      <div
                        key={booking.id}
                        className={`absolute rounded-lg ${color.bg} cursor-pointer hover:opacity-90 transition-all hover:shadow-md group overflow-hidden`}
                        style={{
                          top: pos.top,
                          height: pos.height,
                          left: courtLeft,
                          width: courtWidth,
                          padding: '0 4px',
                        }}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <div className="h-full mx-1 my-0.5 flex flex-col justify-center px-2 py-1 overflow-hidden">
                          <p className="text-[11px] font-semibold text-white truncate leading-tight">
                            {booking.user_name}
                          </p>
                          <p className="text-[9px] text-white/80 truncate">
                            {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                          </p>
                          {booking.player_count && (
                            <p className="text-[9px] text-white/70">
                              {booking.player_count}p
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-4 flex-wrap">
            <span className="text-[10px] text-slate-400 font-medium">Type:</span>
            {[
              { label: 'Reservation', color: 'bg-green-600' },
              { label: 'Event', color: 'bg-violet-600' },
              { label: 'Tournament', color: 'bg-blue-600' },
              { label: 'Lesson', color: 'bg-amber-500' },
              { label: 'Maintenance', color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${item.color}`} />
                <span className="text-[10px] text-slate-500">{item.label}</span>
              </div>
            ))}
            {isToday && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-red-500 rounded" />
                <span className="text-[10px] text-slate-500">Now</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cards View */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {courts.map(court => {
            const courtBookings = getCourtBookings(court.id);
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5);
            const isActive = isToday && courtBookings.some(b => b.start_time <= currentTime && b.end_time > currentTime);
            const currentBooking = isToday ? courtBookings.find(b => b.start_time <= currentTime && b.end_time > currentTime) : null;
            const nextBooking = isToday
              ? courtBookings.find(b => b.start_time > currentTime)
              : courtBookings[0];

            return (
              <div key={court.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Status Bar */}
                <div className={`h-1 ${isActive ? 'bg-red-400' : courtBookings.length > 0 ? 'bg-green-500' : 'bg-slate-200'}`} />

                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">{court.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                    }`}>
                      {isActive ? 'IN USE' : 'OPEN'}
                    </span>
                  </div>

                  {/* Current / Next */}
                  {currentBooking ? (
                    <div className="mb-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
                      <p className="text-[10px] font-medium text-red-500 uppercase tracking-wide mb-1">Playing Now</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{currentBooking.user_name}</p>
                      <p className="text-xs text-slate-500">Until {formatTime(currentBooking.end_time)}</p>
                    </div>
                  ) : nextBooking ? (
                    <div className="mb-3 p-3 rounded-xl bg-green-50/50 border border-green-100">
                      <p className="text-[10px] font-medium text-green-600 uppercase tracking-wide mb-1">Next Up</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{nextBooking.user_name}</p>
                      <p className="text-xs text-slate-500">{formatTime(nextBooking.start_time)} – {formatTime(nextBooking.end_time)}</p>
                    </div>
                  ) : (
                    <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-400 text-center">No bookings</p>
                    </div>
                  )}

                  {/* Mini timeline */}
                  <div className="flex items-center gap-0.5 h-6 mt-2">
                    {HOURS.map(hour => {
                      const hasBooking = courtBookings.some(b => {
                        const startH = parseInt(b.start_time.split(':')[0]);
                        const endH = parseInt(b.end_time.split(':')[0]);
                        return hour >= startH && hour < endH;
                      });
                      const isCurrent = isToday && hour === now.getHours();

                      return (
                        <div
                          key={hour}
                          className={`flex-1 rounded-sm h-full transition-colors ${
                            hasBooking ? 'bg-green-500' : 'bg-slate-100'
                          } ${isCurrent ? 'ring-1 ring-red-400' : ''}`}
                          title={`${formatHourShort(hour)} ${hasBooking ? '(Booked)' : '(Open)'}`}
                        />
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <span className="text-xs text-slate-400">{courtBookings.length} booking{courtBookings.length !== 1 ? 's' : ''}</span>
                    <span className="text-xs font-medium text-slate-500">${court.hourly_rate}/hr</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className={`px-6 py-4 rounded-t-2xl ${getBookingColor(selectedBooking).bg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                    {selectedBooking.booking_type || 'Reservation'}
                  </p>
                  <h3 className="text-lg font-semibold text-white mt-0.5">{selectedBooking.user_name}</h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-400 uppercase">Time</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {formatTime(selectedBooking.start_time)} – {formatTime(selectedBooking.end_time)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-400 uppercase">Court</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {courts.find(c => c.id === selectedBooking.court_id)?.name || 'Unknown'}
                  </p>
                </div>
              </div>

              {selectedBooking.player_count && (
                <div className="flex items-center gap-3 px-1">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{selectedBooking.player_count} players</span>
                </div>
              )}

              {selectedBooking.total_amount > 0 && (
                <div className="flex items-center gap-3 px-1">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">${selectedBooking.total_amount.toFixed(2)}</span>
                </div>
              )}

              {selectedBooking.phone && (
                <div className="flex items-center gap-3 px-1">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{selectedBooking.phone}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-full py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
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
