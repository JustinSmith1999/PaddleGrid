import { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, Loader2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isCourtAvailable, getCourtBlocks, getAvailableSlots } from '../lib/courtAvailability';
import WaiverModal from './WaiverModal';

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

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 24,
    transition: { duration: 0.2 },
  },
};

const inputClasses =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm text-slate-800 transition-all';

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
  const [hasSignedWaiver, setHasSignedWaiver] = useState<boolean | null>(null);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [facilityName, setFacilityName] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    async function checkWaiverStatus() {
      if (!user || !court?.facility_id) return;

      try {
        // Get facility name
        const { data: facility } = await supabase
          .from('facilities')
          .select('name')
          .eq('id', court.facility_id)
          .single();

        if (facility) {
          setFacilityName(facility.name);
        }

        // Check if user has signed waiver for this facility
        const { data: signedWaiver } = await supabase
          .from('signed_waivers')
          .select('id')
          .eq('user_id', user.id)
          .eq('facility_id', court.facility_id)
          .maybeSingle();

        setHasSignedWaiver(!!signedWaiver);

        // If not signed, show waiver modal immediately
        if (!signedWaiver) {
          setShowWaiverModal(true);
        }
      } catch (err) {
        console.error('Error checking waiver status:', err);
        setHasSignedWaiver(false);
      }
    }

    if (user && court?.facility_id) {
      checkWaiverStatus();
    }
  }, [user, court?.facility_id]);

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

  // Show waiver modal first if not signed
  if (showWaiverModal && court.facility_id) {
    return (
      <WaiverModal
        facilityId={court.facility_id}
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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 max-w-lg w-full p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

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

  // --- Booking success state ---
  if (bookingSuccess) {
    return (
      <AnimatePresence>
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 max-w-lg w-full p-10 text-center"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-2 ring-white shadow-sm">
              <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3
              className="text-2xl font-bold text-slate-800 mb-2"
            >
              Booking Confirmed!
            </h3>
            <p className="text-slate-500 text-sm">Your court reservation has been successfully created.</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // --- Payment redirect state ---
  if (paymentUrl) {
    return (
      <AnimatePresence>
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 max-w-lg w-full p-8 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-2 ring-white shadow-sm">
                <DollarSign className="w-8 h-8 text-green-700" />
              </div>
              <h3
                className="text-2xl font-bold text-slate-800 mb-2"
              >
                Complete Payment
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Your booking has been reserved. Please complete payment to confirm your reservation.
              </p>

              <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium text-sm">Total Amount</span>
                  <span className="text-2xl font-bold text-green-700">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePaymentRedirect}
                className="w-full rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold py-3.5 px-4 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Complete Payment on CourtReserve
              </motion.button>

              <p className="text-xs text-slate-400 mt-4">
                You will be redirected to CourtReserve's secure payment page
              </p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // --- Main booking form ---
  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-2xl">
            <div>
              <h2
                className="text-xl font-bold text-slate-800"
              >
                Book {court.name}
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">Select your preferred date and time</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Form body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step indicators */}
              <div className="flex items-center gap-2 mb-1">
                {['Date', 'Duration', 'Time', 'Confirm'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <div className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${
                      i === 0 ? 'bg-green-700 text-white' :
                      (i === 1 && selectedDate) ? 'bg-green-700 text-white' :
                      (i === 2 && duration) ? 'bg-green-700 text-white' :
                      (i === 3 && selectedSlot) ? 'bg-green-700 text-white' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-xs text-slate-400 hidden sm:inline">{step}</span>
                    {i < 3 && <div className="flex-1 h-px bg-slate-100" />}
                  </div>
                ))}
              </div>

              {/* Date */}
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2 text-green-700" />
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className={inputClasses}
                />
                {availabilityWarning && (
                  <div className="mt-2.5 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200/60 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{availabilityWarning} Please check available times carefully.</span>
                  </div>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                  <Clock className="w-4 h-4 mr-2 text-green-700" />
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className={inputClasses}
                >
                  <option value={0.5}>30 minutes</option>
                  <option value={1}>1 hour</option>
                  <option value={1.5}>1.5 hours</option>
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                </select>
              </div>

              {/* Time slots */}
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                  <Clock className="w-4 h-4 mr-2 text-green-700" />
                  Available Time Slots
                </label>
                <select
                  value={selectedSlot}
                  onChange={(e) => handleSlotSelection(e.target.value)}
                  required
                  className={inputClasses}
                >
                  <option value="">Select a time slot...</option>
                  {availableSlots.map((slot, index) => (
                    <option key={index} value={`${slot.start}|${slot.end}`}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                {availableSlots.length === 0 && selectedDate && (
                  <div className="mt-2.5 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200/60 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>No available time slots for this duration on this date. Try a different date or shorter duration.</span>
                  </div>
                )}
                {availableSlots.length > 0 && (
                  <div className="mt-2.5 flex items-start gap-2 text-sm text-green-700 bg-emerald-50 border border-emerald-200/60 rounded-xl p-3">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{availableSlots.length} time slot{availableSlots.length !== 1 ? 's' : ''} available</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className={`${inputClasses} resize-none`}
                  placeholder="Any special requests or notes..."
                />
              </div>

              {/* Price summary */}
              <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm font-medium">Duration</span>
                  <span className="text-slate-800 text-sm font-semibold">{duration} hour{duration !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-px bg-emerald-200/50" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm font-medium flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-green-700">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-start gap-2 bg-red-50 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold py-3 px-4 transition-colors text-sm"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={loading || !selectedSlot}
                  whileHover={!loading && selectedSlot ? { y: -1 } : {}}
                  whileTap={!loading && selectedSlot ? { scale: 0.98 } : {}}
                  className="flex-[2] rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-4 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Booking...
                    </>
                  ) : (
                    'Book Now & Pay'
                  )}
                </motion.button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Payment will be processed securely
              </p>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
