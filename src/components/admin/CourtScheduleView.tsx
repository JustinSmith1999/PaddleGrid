import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, X, ChevronLeft, ChevronRight, MapPin, User, Phone, DollarSign } from 'lucide-react';
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
}

interface AvailabilityBlock {
  id: string;
  court_id: string;
  start_time: string;
  end_time: string;
  block_date: string;
  block_type: string;
  notes: string | null;
}

interface CourtStatus {
  court: Court;
  isOpen: boolean;
  currentBooking?: Booking;
  nextBooking?: Booking;
  todayBookings: Booking[];
}

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export default function CourtScheduleView() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [courtStatuses, setCourtStatuses] = useState<CourtStatus[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourt, setSelectedCourt] = useState<CourtStatus | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (courts.length > 0 && (bookings.length >= 0 || availabilityBlocks.length >= 0)) {
      calculateCourtStatuses();
    }
  }, [courts, bookings, availabilityBlocks]);

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
        .select(`
          *,
          profiles:user_id (full_name)
        `)
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

  const calculateCourtStatuses = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.toISOString().split('T')[0];
    const isToday = selectedDate === today;

    const statuses: CourtStatus[] = courts.map(court => {
      const courtBookings = bookings.filter(b => b.court_id === court.id);

      const courtBlocks: Booking[] = availabilityBlocks
        .filter(b => b.court_id === court.id)
        .map(block => ({
          id: block.id,
          court_id: block.court_id,
          user_id: '',
          start_time: block.start_time,
          end_time: block.end_time,
          booking_date: block.block_date,
          status: 'confirmed',
          total_amount: 0,
          user_name: block.notes || 'CourtReserve Booking'
        }));

      const allBookings = [...courtBookings, ...courtBlocks];

      let currentBooking: Booking | undefined;
      let nextBooking: Booking | undefined;

      if (isToday) {
        currentBooking = allBookings.find(b =>
          b.start_time <= currentTime && b.end_time > currentTime
        );

        nextBooking = allBookings
          .filter(b => b.start_time > currentTime)
          .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
      } else {
        nextBooking = allBookings
          .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
      }

      return {
        court,
        isOpen: !currentBooking,
        currentBooking,
        nextBooking,
        todayBookings: allBookings.sort((a, b) => a.start_time.localeCompare(b.start_time))
      };
    });

    setCourtStatuses(statuses);
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBookingPosition = (startTime: string, endTime: string) => {
    const startIndex = TIME_SLOTS.indexOf(startTime);
    const endIndex = TIME_SLOTS.indexOf(endTime);
    const left = (startIndex / TIME_SLOTS.length) * 100;
    const width = ((endIndex - startIndex) / TIME_SLOTS.length) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-gray-400';
      default:
        return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Court Schedule</h1>
          <p className="text-gray-600 mt-1">Real-time court availability and bookings</p>
        </div>

        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-3 hover:bg-gray-50 transition-colors text-gray-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-6 py-3 border-x border-gray-200">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
            </div>
          </div>
          <button
            onClick={() => handleDateChange(1)}
            className="p-3 hover:bg-gray-50 transition-colors text-gray-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Court Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courtStatuses.map((courtStatus) => (
          <div
            key={courtStatus.court.id}
            onClick={() => setSelectedCourt(courtStatus)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Court Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{courtStatus.court.name}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  courtStatus.isOpen 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {courtStatus.isOpen ? 'Available' : 'In Use'}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">${courtStatus.court.hourly_rate}/hour</p>
            </div>

            {/* Court Status */}
            <div className="p-4">
              {courtStatus.currentBooking ? (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Currently Playing</span>
                  </div>
                  <p className="font-medium text-gray-900">{courtStatus.currentBooking.user_name}</p>
                  <p className="text-sm text-gray-600">
                    Until {formatTime(courtStatus.currentBooking.end_time)}
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Available Now</span>
                  </div>
                  <p className="text-gray-600">Ready for booking</p>
                </div>
              )}

              {/* Next Booking */}
              {courtStatus.nextBooking && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Next Up</span>
                  </div>
                  <p className="font-medium text-gray-900">{courtStatus.nextBooking.user_name}</p>
                  <p className="text-sm text-gray-600">
                    {formatTime(courtStatus.nextBooking.start_time)} - {formatTime(courtStatus.nextBooking.end_time)}
                  </p>
                </div>
              )}

              {/* Daily Summary */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Today's Bookings</span>
                  <span className="text-sm font-semibold text-gray-900">{courtStatus.todayBookings.length}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Court Detail Modal */}
      {selectedCourt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-emerald-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{selectedCourt.court.name}</h3>
                  <p className="text-emerald-100">{formatDate(selectedDate)} Schedule</p>
                </div>
                <button
                  onClick={() => setSelectedCourt(null)}
                  className="p-2 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Calendar-Style Day View */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <h4 className="text-lg font-bold text-stone-800 mb-6">Daily Schedule</h4>

              {selectedCourt.todayBookings.length === 0 ? (
                <div className="text-center py-20 bg-stone-50 rounded-xl border-2 border-stone-200">
                  <Calendar className="w-20 h-20 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-600 font-medium text-xl">No bookings scheduled</p>
                  <p className="text-stone-500 text-sm mt-2">This court is available all day</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Time Grid */}
                  <div className="flex">
                    {/* Time Labels Column */}
                    <div className="w-24 flex-shrink-0">
                      {Array.from({ length: 15 }, (_, i) => {
                        const hour = i + 6;
                        const displayHour = hour > 12 ? hour - 12 : hour;
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        return (
                          <div key={i} className="h-20 flex items-start justify-end pr-4">
                            <span className="text-sm font-semibold text-stone-600">
                              {displayHour}:00 {ampm}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Schedule Column */}
                    <div className="flex-1 relative border-l-2 border-stone-300">
                      {/* Hour Rows with 30-min dividers */}
                      {Array.from({ length: 15 }, (_, i) => (
                        <div key={i}>
                          <div className="h-10 border-b border-stone-200 bg-white"></div>
                          <div className="h-10 border-b border-stone-100 bg-stone-50/30"></div>
                        </div>
                      ))}

                      {/* Current Time Indicator */}
                      {selectedDate === new Date().toISOString().split('T')[0] && (() => {
                        const now = new Date();
                        const currentHour = now.getHours();
                        const currentMinute = now.getMinutes();
                        if (currentHour >= 6 && currentHour < 20) {
                          const minutesSince6AM = (currentHour - 6) * 60 + currentMinute;
                          const topPosition = (minutesSince6AM / 60) * 80;

                          return (
                            <div
                              className="absolute left-0 right-0 z-30"
                              style={{ top: `${topPosition}px` }}
                            >
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                                <div className="flex-1 h-0.5 bg-red-600 shadow-md"></div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Booking Blocks */}
                      {selectedCourt.todayBookings.map((booking) => {
                        const [startHour, startMin] = booking.start_time.split(':').map(Number);
                        const [endHour, endMin] = booking.end_time.split(':').map(Number);

                        const startMinutes = (startHour - 6) * 60 + startMin;
                        const endMinutes = (endHour - 6) * 60 + endMin;
                        const duration = endMinutes - startMinutes;

                        const topPosition = (startMinutes / 60) * 80;
                        const height = (duration / 60) * 80;

                        const statusConfig = {
                          confirmed: {
                            bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
                            border: 'border-emerald-600',
                            shadow: 'shadow-emerald-200'
                          },
                          pending: {
                            bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
                            border: 'border-orange-600',
                            shadow: 'shadow-orange-200'
                          },
                          completed: {
                            bg: 'bg-gradient-to-br from-stone-400 to-stone-600',
                            border: 'border-stone-600',
                            shadow: 'shadow-stone-200'
                          }
                        };
                        const config = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.confirmed;

                        return (
                          <div
                            key={booking.id}
                            className={`absolute left-2 right-2 ${config.bg} ${config.border} border-l-4 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all cursor-pointer z-10 group`}
                            style={{
                              top: `${topPosition}px`,
                              height: `${height - 4}px`,
                              minHeight: '60px'
                            }}
                          >
                            <div className="h-full flex flex-col text-white">
                              <div className="font-bold text-base mb-1 truncate">{booking.user_name}</div>
                              <div className="text-sm font-medium opacity-95 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                              </div>
                              <div className="text-sm font-semibold mt-1 flex items-center space-x-1">
                                <DollarSign className="w-3 h-3" />
                                <span>${booking.total_amount.toFixed(2)}</span>
                              </div>
                              <div className="mt-auto">
                                <span className="inline-block text-xs px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                                  {booking.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-lg"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center space-x-6 mt-8 pt-6 border-t-2 border-stone-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded border-l-4 border-emerald-600 shadow-md" />
                      <span className="text-stone-700 font-semibold text-sm">Confirmed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded border-l-4 border-orange-600 shadow-md" />
                      <span className="text-stone-700 font-semibold text-sm">Pending</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-stone-400 to-stone-600 rounded border-l-4 border-stone-600 shadow-md" />
                      <span className="text-stone-700 font-semibold text-sm">Completed</span>
                    </div>
                    {selectedDate === new Date().toISOString().split('T')[0] && (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                        <span className="text-stone-700 font-semibold text-sm">Current Time</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}