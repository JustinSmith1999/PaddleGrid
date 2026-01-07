import { useState, useEffect } from 'react';
import { Calendar, Clock, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCourtBlocks } from '../lib/courtAvailability';
import WaiverModal from './WaiverModal';

interface Court {
  id: string;
  name: string;
  hourly_rate: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  bookingId?: string;
}

interface AdvancedBookingCalendarProps {
  court: Court;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export function AdvancedBookingCalendar({ court, onClose, onSuccess, userId }: AdvancedBookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(1);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [hasSignedWaiver, setHasSignedWaiver] = useState<boolean | null>(null);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [facilityName, setFacilityName] = useState('');

  const [timeOptions, setTimeOptions] = useState<string[]>([]);

  useEffect(() => {
    async function checkWaiverStatus() {
      if (!userId) return;

      try {
        const { data: courtData } = await supabase
          .from('courts')
          .select('facility_id, facilities(name)')
          .eq('id', court.id)
          .single();

        if (courtData?.facility_id) {
          setFacilityId(courtData.facility_id);
          setFacilityName((courtData.facilities as any)?.name || '');

          const { data: signedWaiver } = await supabase
            .from('signed_waivers')
            .select('id')
            .eq('user_id', userId)
            .eq('facility_id', courtData.facility_id)
            .maybeSingle();

          setHasSignedWaiver(!!signedWaiver);

          if (!signedWaiver) {
            setShowWaiverModal(true);
          }
        }
      } catch (err) {
        console.error('Error checking waiver status:', err);
        setHasSignedWaiver(false);
      }
    }

    if (userId) {
      checkWaiverStatus();
    }
  }, [userId, court.id]);

  useEffect(() => {
    const loadOperatingHours = async () => {
      const { data: courtData } = await supabase
        .from('courts')
        .select('facility_id, facilities(settings)')
        .eq('id', court.id)
        .single();

      let openHour = 6;
      let closeHour = 23;

      if (courtData?.facilities?.settings?.operating_hours) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const dayOfWeek = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const dayHours = courtData.facilities.settings.operating_hours[dayOfWeek];

        if (dayHours && dayHours.is_open) {
          const [openH] = dayHours.open.split(':').map(Number);
          let [closeH] = dayHours.close.split(':').map(Number);
          openHour = openH;
          if (closeH === 0) closeH = 24;
          closeHour = closeH;
        }
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const isToday = selectedDateStr === today;

      const slots = [];
      for (let hour = openHour; hour <= closeHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          if (hour === closeHour && minute > 0) break;

          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          if (isToday) {
            const slotDate = new Date(selectedDate);
            slotDate.setHours(hour, minute, 0, 0);
            if (slotDate <= now) continue;
          }

          slots.push(timeStr);
        }
      }
      setTimeOptions(slots);
    };

    loadOperatingHours();
  }, [court.id, selectedDate]);

  useEffect(() => {
    checkAvailability();
  }, [selectedDate, court.id, timeOptions]);

  const checkAvailability = async () => {
    if (timeOptions.length === 0) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const blocks = await getCourtBlocks(court.id, dateStr);

    const slots: TimeSlot[] = timeOptions.map(time => {
      const timeWithSeconds = `${time}:00`;
      const isBlocked = blocks.some(block => {
        const blockStart = block.start_time;
        const blockEnd = block.end_time;
        return timeWithSeconds >= blockStart && timeWithSeconds < blockEnd;
      });

      return {
        time,
        available: !isBlocked
      };
    });

    setTimeSlots(slots);
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate >= new Date(new Date().setHours(0, 0, 0, 0))) {
      setSelectedDate(newDate);
      setSelectedStartTime('');
    }
  };

  const calculateEndTime = (startTime: string, hours: number): string => {
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + hours * 60;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  const isTimeSlotAvailable = (startTime: string, durationHours: number): boolean => {
    const startIndex = timeOptions.indexOf(startTime);
    const slotsNeeded = durationHours * 2;

    for (let i = 0; i < slotsNeeded; i++) {
      if (startIndex + i >= timeSlots.length || !timeSlots[startIndex + i]?.available) {
        return false;
      }
    }
    return true;
  };

  const handleBooking = async () => {
    if (!selectedStartTime) return;

    if (!isTimeSlotAvailable(selectedStartTime, duration)) {
      alert('Selected time slot is not fully available. Please choose a different time.');
      return;
    }

    setLoading(true);

    try {
      const endTime = calculateEndTime(selectedStartTime, duration);
      const totalAmount = court.hourly_rate * duration;

      const { data: courtData } = await supabase
        .from('courts')
        .select('facility_id')
        .eq('id', court.id)
        .single();

      const { error } = await supabase.from('bookings').insert({
        court_id: court.id,
        facility_id: courtData?.facility_id,
        user_id: userId,
        booking_date: selectedDate.toISOString().split('T')[0],
        start_time: selectedStartTime,
        end_time: endTime,
        duration_hours: duration,
        total_amount: totalAmount,
        status: 'confirmed',
        payment_status: 'paid',
        notes: bookingNotes || null,
      });

      if (error) throw error;

      const { data: statsData } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (statsData) {
        await supabase
          .from('player_stats')
          .update({
            total_bookings: statsData.total_bookings + 1,
            total_hours_played: Number(statsData.total_hours_played) + duration,
            total_spent: Number(statsData.total_spent) + totalAmount,
          })
          .eq('user_id', userId);
      } else {
        await supabase.from('player_stats').insert({
          user_id: userId,
          total_bookings: 1,
          total_hours_played: duration,
          total_spent: totalAmount,
          favorite_court_id: court.id,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const totalCost = court.hourly_rate * duration;

  // Show waiver modal first if not signed
  if (showWaiverModal && facilityId) {
    return (
      <WaiverModal
        facilityId={facilityId}
        facilityName={facilityName || 'this facility'}
        onClose={() => {
          setShowWaiverModal(false);
          onClose();
        }}
        onSigned={() => {
          setHasSignedWaiver(true);
          setShowWaiverModal(false);
        }}
      />
    );
  }

  // Show loading state while checking waiver
  if (hasSignedWaiver === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{court.name}</h2>
            <p className="text-emerald-100">${court.hourly_rate}/hour</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                disabled={isToday}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-lg">{formatDate(selectedDate)}</span>
              </div>
              <button
                onClick={() => handleDateChange(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Clock className="w-4 h-4 inline mr-1" />
                Select Start Time
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {timeSlots.map((slot) => {
                  const canBook = isTimeSlotAvailable(slot.time, duration);
                  const isSelected = selectedStartTime === slot.time;

                  return (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && canBook && setSelectedStartTime(slot.time)}
                      disabled={!slot.available || !canBook}
                      className={`p-2 rounded-lg text-sm font-medium transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md'
                          : slot.available && canBook
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (hours)
                </label>
                <div className="flex gap-2">
                  {[0.5, 1, 1.5, 2, 3].map((hours) => (
                    <button
                      key={hours}
                      onClick={() => {
                        setDuration(hours);
                        setSelectedStartTime('');
                      }}
                      className={`flex-1 p-2 rounded-lg font-medium transition ${
                        duration === hours
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any special requests or notes..."
                />
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{duration} hour{duration !== 1 ? 's' : ''}</span>
                </div>
                {selectedStartTime && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-semibold">
                      {selectedStartTime} - {calculateEndTime(selectedStartTime, duration)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                  <span className="text-lg font-bold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-emerald-600">${totalCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={!selectedStartTime || loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Booking...
                  </span>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <p className="text-sm text-blue-800">
              <strong>Booking Policy:</strong> Cancellations must be made at least 2 hours before your scheduled time for a full refund.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
