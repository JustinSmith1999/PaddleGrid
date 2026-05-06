import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { sortCourtsByNumber } from '../lib/courtUtils';
import WaiverModal from './WaiverModal';

interface Court {
  id: string;
  name: string;
  hourly_rate: number;
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

interface CourtSchedulerProps {
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  initialCourtId?: string | null;
}

export function CourtScheduler({ onClose, onSuccess, userId, initialCourtId }: CourtSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [courts, setCourts] = useState<Court[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: string; time: string; duration: number } | null>(null);
  const [slotGranularity, setSlotGranularity] = useState<number>(1);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [selectedCourtFilter, setSelectedCourtFilter] = useState<string | null>(initialCourtId || null);
  const [operatingHours, setOperatingHours] = useState<{ open: number; close: number }>({ open: 6, close: 24 });
  const [hasSignedWaiver, setHasSignedWaiver] = useState<boolean | null>(null);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [facilityName, setFacilityName] = useState('');
  const [dateDirection, setDateDirection] = useState<number>(0);
  const firstAvailableRef = useRef<HTMLDivElement | null>(null);

  const generateTimeSlots = (granularity: number) => {
    const slots = [];
    const totalHours = operatingHours.close - operatingHours.open;
    const totalSlots = Math.floor(totalHours / granularity);

    for (let i = 0; i < totalSlots; i++) {
      const totalMinutes = (operatingHours.open * 60) + (i * granularity * 60);
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';

      slots.push({
        time,
        display: `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`,
        duration: granularity
      });
    }

    return slots;
  };

  const timeSlots = generateTimeSlots(slotGranularity);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  useEffect(() => {
    async function checkWaiverStatus() {
      if (!userId) return;

      try {
        const { data: courtsData } = await supabase
          .from('courts')
          .select('facility_id, facilities(name)')
          .eq('is_active', true)
          .limit(1)
          .single();

        if (courtsData?.facility_id) {
          setFacilityId(courtsData.facility_id);
          setFacilityName((courtsData.facilities as any)?.name || '');

          const { data: signedWaiver } = await supabase
            .from('signed_waivers')
            .select('id')
            .eq('user_id', userId)
            .eq('facility_id', courtsData.facility_id)
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
  }, [userId]);

  async function loadData() {
    setLoading(true);
    const dateStr = selectedDate.toISOString().split('T')[0];

    const [courtsRes, blocksRes, facilityRes] = await Promise.all([
      supabase.from('courts').select('*').eq('is_active', true),
      supabase
        .from('court_availability_blocks')
        .select('*')
        .eq('block_date', dateStr),
      supabase.from('facilities').select('settings').limit(1).single()
    ]);

    if (courtsRes.data) setCourts(sortCourtsByNumber(courtsRes.data));
    if (blocksRes.data) setBlocks(blocksRes.data);

    if (facilityRes.data?.settings?.operating_hours) {
      const dayOfWeek = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayHours = facilityRes.data.settings.operating_hours[dayOfWeek];

      if (dayHours && dayHours.is_open) {
        const [openH] = dayHours.open.split(':').map(Number);
        let [closeH] = dayHours.close.split(':').map(Number);
        if (closeH === 0) closeH = 24;
        setOperatingHours({ open: openH, close: closeH });
      }
    }

    setLoading(false);
  }

  function handleDateChange(days: number) {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate >= new Date(new Date().setHours(0, 0, 0, 0))) {
      setDateDirection(days);
      setSelectedDate(newDate);
      setSelectedSlot(null);
      firstAvailableRef.current = null;
    }
  }

  function getSlotStatus(courtId: string, time: string, slotDuration: number): 'available' | 'booked' {
    const timeNum = parseInt(time.replace(':', ''));
    const endTimeNum = timeNum + (slotDuration * 100);

    for (const block of blocks) {
      if (block.court_id !== courtId) continue;

      const blockStart = parseInt(block.start_time.substring(0, 5).replace(':', ''));
      const blockEnd = parseInt(block.end_time.substring(0, 5).replace(':', ''));

      if ((timeNum >= blockStart && timeNum < blockEnd) ||
          (endTimeNum > blockStart && endTimeNum <= blockEnd) ||
          (timeNum <= blockStart && endTimeNum >= blockEnd)) {
        return 'booked';
      }
    }

    return 'available';
  }

  function getBookedBy(courtId: string, time: string): string | null {
    const timeNum = parseInt(time.replace(':', ''));

    for (const block of blocks) {
      if (block.court_id !== courtId) continue;

      const blockStart = parseInt(block.start_time.substring(0, 5).replace(':', ''));
      const blockEnd = parseInt(block.end_time.substring(0, 5).replace(':', ''));

      if (timeNum >= blockStart && timeNum < blockEnd) {
        return block.notes || 'Reserved';
      }
    }

    return null;
  }

  function calculateEndTime(startTime: string, hours: number): string {
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + hours * 60;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  }

  async function handleBooking() {
    if (!selectedSlot) return;

    setBookingInProgress(true);

    try {
      const court = courts.find(c => c.id === selectedSlot.courtId);
      if (!court) throw new Error('Court not found');

      const { data: courtData } = await supabase
        .from('courts')
        .select('facility_id')
        .eq('id', selectedSlot.courtId)
        .single();

      const { data: userData } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .maybeSingle();

      const endTime = calculateEndTime(selectedSlot.time, selectedSlot.duration);
      const totalAmount = court.hourly_rate * selectedSlot.duration;

      const userName = userData?.first_name && userData?.last_name
        ? `${userData.first_name} ${userData.last_name}`
        : userData?.email || 'User';

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/courtreserve-booking`;

      const bookingPayload = {
        facility_id: courtData?.facility_id,
        court_id: selectedSlot.courtId,
        user_id: userId,
        booking_date: selectedDate.toISOString().split('T')[0],
        start_time: selectedSlot.time,
        end_time: endTime,
        duration_hours: selectedSlot.duration,
        total_amount: totalAmount,
        user_email: userData?.email,
        user_name: userName,
        court_name: court.name,
      };

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const result = await response.json();

      if (result.courtreserve_synced) {
        console.log('Booking synced to CourtReserve:', result.courtreserve_booking_id);
      } else if (result.courtreserve_error) {
        console.warn('CourtReserve sync failed:', result.courtreserve_error);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const filteredTimeSlots = timeSlots.filter(slot => {
    if (!isToday) return true;

    const now = new Date();
    const [hour, minute] = slot.time.split(':').map(Number);
    const slotDate = new Date(selectedDate);
    slotDate.setHours(hour, minute, 0, 0);

    return slotDate > now;
  });

  const selectedCourt = courts.find(c => c.id === selectedSlot?.courtId);
  const totalCost = selectedCourt && selectedSlot ? selectedCourt.hourly_rate * selectedSlot.duration : 0;
  const displayedCourts = selectedCourtFilter
    ? courts.filter(c => c.id === selectedCourtFilter)
    : courts;

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-0 md:p-6"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        <div className="bg-white shadow-[0_24px_48px_rgba(0,0,0,0.12)] w-full md:max-w-lg md:rounded-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-0 md:p-6"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="bg-white shadow-[0_24px_48px_rgba(0,0,0,0.12)] w-full h-full md:h-[90vh] md:max-w-5xl md:rounded-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 flex-shrink-0 md:rounded-t-2xl">
          <div className="min-w-0 flex-1 pr-2 flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-xl flex-shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, Inter, system-ui, sans-serif' }}>
              Court Scheduler
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: selectedSlot ? '220px' : '16px' }}>
          <div className="p-3 sm:p-4 md:p-6 space-y-4">

            {/* Date Navigation */}
            <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleDateChange(-1)}
                  disabled={isToday}
                  className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 hover:shadow transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </button>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedDate.toISOString()}
                    initial={{ opacity: 0, x: dateDirection > 0 ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dateDirection > 0 ? -30 : 30 }}
                    transition={{ duration: 0.2 }}
                    className="text-center px-3 min-w-0 flex-1"
                  >
                    <div className="font-bold text-slate-900 text-sm sm:text-base md:text-lg truncate">
                      {formatDate(selectedDate)}
                    </div>
                    {isToday && (
                      <span className="text-xs text-green-600 font-medium">Today</span>
                    )}
                  </motion.div>
                </AnimatePresence>
                <button
                  onClick={() => handleDateChange(1)}
                  className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 hover:shadow transition flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3">
              {/* Time Slots */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-slate-700 flex-shrink-0">Time Slots</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 0.5, label: '30 min' },
                    { value: 1, label: '1 hour' },
                    { value: 1.5, label: '1.5 hours' },
                    { value: 2, label: '2 hours' }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSlotGranularity(value);
                        setSelectedSlot(null);
                        firstAvailableRef.current = null;
                      }}
                      className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 ${
                        slotGranularity === value
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-green-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Court Filter */}
              {!initialCourtId && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-slate-700 flex-shrink-0">Court</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedCourtFilter(null);
                        firstAvailableRef.current = null;
                      }}
                      className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 ${
                        selectedCourtFilter === null
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-green-300'
                      }`}
                    >
                      All Courts
                    </button>
                    {courts.map((court) => (
                      <button
                        key={court.id}
                        onClick={() => {
                          setSelectedCourtFilter(court.id);
                          firstAvailableRef.current = null;
                        }}
                        className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 ${
                          selectedCourtFilter === court.id
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-green-300'
                        }`}
                      >
                        {court.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
                  <span>Selected</span>
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 text-green-600 animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDate.toISOString() + slotGranularity}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden"
                >
                  <div className={`overflow-x-auto ${displayedCourts.length === 1 ? '' : 'pb-2'}`}>
                    <div className={displayedCourts.length === 1 ? 'min-w-full' : 'min-w-[500px]'}>
                      {/* Header Row */}
                      <div
                        className="grid bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10"
                        style={{ gridTemplateColumns: `70px repeat(${displayedCourts.length}, minmax(100px, 1fr))` }}
                      >
                        <div className="p-2 sm:p-3 font-semibold text-slate-500 border-r border-slate-200/60 text-[10px] sm:text-xs md:text-sm flex items-center">
                          Time
                        </div>
                        {displayedCourts.map((court) => (
                          <div key={court.id} className="p-2 sm:p-3 text-center border-r last:border-r-0 border-slate-200/60">
                            <div className="font-semibold text-slate-700 text-[10px] sm:text-xs md:text-sm truncate">{court.name}</div>
                            <div className="text-[9px] sm:text-xs text-slate-400 font-normal mt-0.5">${court.hourly_rate}/hr</div>
                          </div>
                        ))}
                      </div>

                      {/* Time Rows */}
                      {filteredTimeSlots.map((slot, slotIndex) => {
                        const rowHeight = slot.duration * 100;
                        let isFirstAvailable = false;

                        if (!isFirstAvailable && firstAvailableRef.current === null) {
                          for (const court of displayedCourts) {
                            if (getSlotStatus(court.id, slot.time, slot.duration) === 'available') {
                              isFirstAvailable = true;
                              break;
                            }
                          }
                        }

                        return (
                          <motion.div
                            key={slot.time}
                            ref={isFirstAvailable ? firstAvailableRef : null}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: Math.min(slotIndex * 0.03, 0.5) }}
                            className="grid border-b last:border-b-0 border-slate-100"
                            style={{
                              gridTemplateColumns: `70px repeat(${displayedCourts.length}, minmax(100px, 1fr))`,
                              minHeight: `${rowHeight}px`
                            }}
                          >
                            <div
                              className="p-1.5 sm:p-2 md:p-3 text-slate-500 border-r border-slate-200/60 flex flex-col justify-center text-[10px] sm:text-xs md:text-sm"
                              style={{ minHeight: `${rowHeight}px` }}
                            >
                              <div className="font-semibold text-slate-600">{slot.display}</div>
                              <div className="text-[9px] sm:text-xs text-slate-400 mt-0.5">
                                {slot.duration === 0.5 ? '30 min' : `${slot.duration} hr${slot.duration !== 1 ? 's' : ''}`}
                              </div>
                            </div>
                            {displayedCourts.map((court) => {
                              const status = getSlotStatus(court.id, slot.time, slot.duration);
                              const bookedBy = getBookedBy(court.id, slot.time);
                              const isSelected = selectedSlot?.courtId === court.id && selectedSlot?.time === slot.time;

                              return (
                                <div
                                  key={court.id}
                                  onClick={() => {
                                    if (status !== 'booked') {
                                      setSelectedSlot({ courtId: court.id, time: slot.time, duration: slot.duration });
                                    }
                                  }}
                                  className={`p-1.5 sm:p-2 md:p-3 border-r last:border-r-0 border-slate-200/60 transition-all duration-200 flex items-center justify-center relative ${
                                    isSelected
                                      ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2'
                                      : status === 'available'
                                      ? 'bg-green-50/50 hover:bg-green-100 border border-transparent hover:border-green-200 cursor-pointer'
                                      : 'bg-red-50/50 border border-transparent'
                                  }`}
                                  style={{ minHeight: `${rowHeight}px` }}
                                >
                                  {status === 'available' && (
                                    <div className="text-center">
                                      <Check className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto ${isSelected ? 'text-white' : 'text-green-500'}`} />
                                      {isSelected && (
                                        <span className="text-[10px] sm:text-xs font-medium mt-1 block text-white/90">Selected</span>
                                      )}
                                    </div>
                                  )}
                                  {status === 'booked' && (
                                    <div className="text-center">
                                      <X className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-red-400" />
                                      {bookedBy && (
                                        <p className="text-[9px] sm:text-xs text-red-500 truncate max-w-full px-1 mt-0.5">{bookedBy}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Booking Summary Panel */}
        <AnimatePresence>
          {selectedSlot && selectedCourt && (
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] z-20 md:rounded-b-2xl"
            >
              <div className="p-4 sm:p-5 md:p-6">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-3" style={{ fontFamily: 'Manrope, Inter, system-ui, sans-serif' }}>
                  Booking Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Court</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedCourt.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Date</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedDate.toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Time</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedSlot.time} - {calculateEndTime(selectedSlot.time, selectedSlot.duration)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Duration</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedSlot.duration === 0.5 ? '30 min' : `${selectedSlot.duration} hr${selectedSlot.duration !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Total</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">${totalCost.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleBooking}
                    disabled={bookingInProgress}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 px-6 sm:px-8 font-semibold shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm sm:text-base"
                  >
                    {bookingInProgress ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
