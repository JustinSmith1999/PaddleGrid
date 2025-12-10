import { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, Loader2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isCourtAvailable, getCourtBlocks, getAvailableSlots } from '../lib/courtAvailability';

interface Court {
  id: string;
  name: string;
  hourly_rate: number;
  facility_id?: string;
}

interface BookingModalProps {
  court: Court | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingModal({ court, onClose, onSuccess }: BookingModalProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availabilityWarning, setAvailabilityWarning] = useState('');
  const [availableSlots, setAvailableSlots] = useState<Array<{ start: string; end: string; label: string }>>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    const loadAvailability = async () => {
      if (court && selectedDate && duration) {
        const slots = await getAvailableSlots(court.id, selectedDate, duration);
        setAvailableSlots(slots);

        const blocks = await getCourtBlocks(court.id, selectedDate);
        if (blocks.length > 0) {
          setAvailabilityWarning(`This court has ${blocks.length} existing availability block(s) on this date.`);
        } else {
          setAvailabilityWarning('');
        }

        setSelectedSlot('');
        setStartTime('');
      }
    };

    loadAvailability();
  }, [court, selectedDate, duration]);

  if (!court) return null;

  const totalAmount = court.hourly_rate * duration;

  const calculateEndTime = (start: string, hours: number): string => {
    const [h, m] = start.split(':').map(Number);
    const endHour = h + hours;
    return `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleSlotSelection = (slotValue: string) => {
    setSelectedSlot(slotValue);
    if (slotValue) {
      const [start] = slotValue.split('|');
      setStartTime(start);
    } else {
      setStartTime('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const endTime = calculateEndTime(startTime, duration);

      const available = await isCourtAvailable(court.id, selectedDate, `${startTime}:00`, `${endTime}:00`);
      if (!available) {
        throw new Error('This time slot conflicts with an existing facility reservation. Please choose a different time.');
      }

      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('*')
        .eq('court_id', court.id)
        .eq('booking_date', selectedDate)
        .neq('status', 'cancelled');

      if (checkError) throw checkError;

      const requestedStart = new Date(`2000-01-01T${startTime}`);
      const requestedEnd = new Date(`2000-01-01T${endTime}`);

      const hasConflict = existingBookings?.some((booking) => {
        const bookingStart = new Date(`2000-01-01T${booking.start_time}`);
        const bookingEnd = new Date(`2000-01-01T${booking.end_time}`);

        return (
          (requestedStart >= bookingStart && requestedStart < bookingEnd) ||
          (requestedEnd > bookingStart && requestedEnd <= bookingEnd) ||
          (requestedStart <= bookingStart && requestedEnd >= bookingEnd)
        );
      });

      if (hasConflict) {
        throw new Error('This time slot is already booked. Please choose a different time.');
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userEmail = authUser?.email || '';

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', user.id)
        .maybeSingle();

      const userName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : 'Guest';

      const facilityId = court.facility_id;
      if (!facilityId) {
        throw new Error('Facility information is missing for this court');
      }

      const bookingPayload = {
        facility_id: facilityId,
        court_id: court.id,
        user_id: user.id,
        booking_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        duration_hours: duration,
        total_amount: totalAmount,
        user_email: userEmail,
        user_name: userName,
        user_phone: profile?.phone || '',
        court_name: court.name,
      };

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/courtreserve-booking`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to create booking');
      }

      if (result.payment_url) {
        setPaymentUrl(result.payment_url);
      } else if (result.courtreserve_synced && !result.payment_url) {
        setBookingSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setBookingSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentRedirect = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
          <p className="text-gray-600">Your court reservation has been successfully created.</p>
        </div>
      </div>
    );
  }

  if (paymentUrl) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h3>
            <p className="text-gray-600 mb-6">Your booking has been reserved. Please complete payment to confirm your reservation.</p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePaymentRedirect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Complete Payment on CourtReserve
            </button>

            <p className="text-sm text-gray-500 mt-4">
              You will be redirected to CourtReserve's secure payment page
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-gray-800 mb-2">Book {court.name}</h2>
        <p className="text-gray-600 mb-6">Select your preferred date and time</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
            {availabilityWarning && (
              <div className="mt-2 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{availabilityWarning} Please check available times carefully.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-emerald-600" />
              Duration (hours)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            >
              <option value={0.5}>30 minutes</option>
              <option value={1}>1 hour</option>
              <option value={1.5}>1.5 hours</option>
              <option value={2}>2 hours</option>
              <option value={3}>3 hours</option>
              <option value={4}>4 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-emerald-600" />
              Available Time Slots
            </label>
            <select
              value={selectedSlot}
              onChange={(e) => handleSlotSelection(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">Select a time slot...</option>
              {availableSlots.map((slot, index) => (
                <option key={index} value={`${slot.start}|${slot.end}`}>
                  {slot.label}
                </option>
              ))}
            </select>
            {availableSlots.length === 0 && selectedDate && (
              <div className="mt-2 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>No available time slots for this duration on this date. Try selecting a different date or shorter duration.</span>
              </div>
            )}
            {availableSlots.length > 0 && (
              <div className="mt-2 flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{availableSlots.length} time slot{availableSlots.length !== 1 ? 's' : ''} available</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="Any special requests or notes..."
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">Duration:</span>
              <span className="text-gray-900">{duration} hour{duration !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Total Amount:
              </span>
              <span className="text-2xl font-bold text-emerald-600">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedSlot}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Booking...
              </>
            ) : (
              <>Book Now & Pay</>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Payment will be processed securely
          </p>
        </form>
      </div>
    </div>
  );
}
