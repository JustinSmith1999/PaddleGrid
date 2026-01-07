import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Check, AlertCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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

  // Removed auto-scroll to allow users to see all time slots from the beginning

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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-6">
        <div className="bg-white shadow-2xl w-full md:max-w-lg md:rounded-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-6">
      <div className="bg-white shadow-2xl w-full h-full md:h-[90vh] md:max-w-5xl md:rounded-2xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-2.5 sm:p-3 md:p-4 flex items-center justify-between z-10 flex-shrink-0 md:rounded-t-2xl">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <h2 className="text-base sm:text-xl md:text-xl font-bold">Court Scheduler</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: selectedSlot ? '200px' : '16px' }}>
          <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg md:rounded-xl p-2 sm:p-3 md:p-4 border border-green-100">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <button
                onClick={() => handleDateChange(-1)}
                disabled={isToday}
                className="p-1.5 sm:p-2 hover:bg-green-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="text-center px-2 min-w-0 flex-1">
                <div className="font-bold text-gray-800 text-xs sm:text-sm md:text-base truncate">{formatDate(selectedDate)}</div>
              </div>
              <button
                onClick={() => handleDateChange(1)}
                className="p-1.5 sm:p-2 hover:bg-green-100 rounded-lg transition flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 flex-shrink-0">Time Slots:</label>
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
                      className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition ${
                        slotGranularity === value
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {!initialCourtId && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 flex-shrink-0">Filter by Court:</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedCourtFilter(null);
                        firstAvailableRef.current = null;
                      }}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition ${
                        selectedCourtFilter === null
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                        className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition ${
                          selectedCourtFilter === court.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {court.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs mt-2 sm:mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded flex-shrink-0"></div>
                <span className="text-gray-700 font-medium">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-100 border-2 border-red-500 rounded flex-shrink-0"></div>
                <span className="text-gray-700 font-medium">Booked</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 shadow-sm overflow-auto">
              <div className={`overflow-x-auto ${displayedCourts.length === 1 ? '' : 'pb-2'}`}>
                <div className={displayedCourts.length === 1 ? 'min-w-full' : 'min-w-[500px]'}>
                  <div className="grid border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 shadow-sm" style={{ gridTemplateColumns: `70px repeat(${displayedCourts.length}, minmax(100px, 1fr))` }}>
                  <div className="p-1.5 sm:p-2 md:p-3 font-bold text-gray-700 border-r border-gray-200 text-[10px] sm:text-xs md:text-sm flex items-center">Time</div>
                  {displayedCourts.map((court) => (
                    <div key={court.id} className="p-1.5 sm:p-2 md:p-3 font-bold text-gray-700 text-center border-r last:border-r-0 border-gray-200 text-[10px] sm:text-xs md:text-sm">
                      <div className="truncate">{court.name}</div>
                      <div className="text-[9px] sm:text-xs text-gray-500 font-normal">${court.hourly_rate}/hr</div>
                    </div>
                  ))}
                </div>

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
                    <div
                      key={slot.time}
                      ref={isFirstAvailable ? firstAvailableRef : null}
                      className="grid border-b last:border-b-0 border-gray-200"
                      style={{
                        gridTemplateColumns: `70px repeat(${displayedCourts.length}, minmax(100px, 1fr))`,
                        minHeight: `${rowHeight}px`
                      }}
                    >
                      <div
                        className="p-1.5 sm:p-2 md:p-3 font-medium text-gray-700 border-r border-gray-200 flex flex-col justify-center text-[10px] sm:text-xs md:text-sm"
                        style={{ minHeight: `${rowHeight}px` }}
                      >
                        <div className="font-bold">{slot.display}</div>
                        <div className="text-[9px] sm:text-xs text-gray-500 mt-0.5">
                          ({slot.duration === 0.5 ? '30 min' : `${slot.duration} hr${slot.duration !== 1 ? 's' : ''}`})
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
                            className={`p-1.5 sm:p-2 md:p-3 border-r last:border-r-0 border-gray-200 ${
                              isSelected
                                ? 'bg-green-600 ring-2 md:ring-3 ring-green-600 ring-inset'
                                : status === 'available'
                                ? 'bg-green-50 hover:bg-green-100 cursor-pointer'
                                : 'bg-red-100'
                            } transition-all duration-200 flex items-center justify-center relative`}
                            style={{ minHeight: `${rowHeight}px` }}
                          >
                            {status === 'available' && (
                              <div className="text-center">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <Check className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0 ${isSelected ? 'text-white' : 'text-green-600'}`} />
                                  <span className={`text-[10px] sm:text-xs md:text-sm font-semibold ${isSelected ? 'text-white' : 'text-green-600'}`}>
                                    Available
                                  </span>
                                  {slot.duration >= 1 && (
                                    <span className={`text-[9px] sm:text-xs ${isSelected ? 'text-white/90' : 'text-green-500'}`}>
                                      {slot.duration === 0.5 ? '30 min' : `${slot.duration} hour${slot.duration !== 1 ? 's' : ''}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            {status === 'booked' && (
                              <div className="text-center">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0 text-red-600" />
                                  <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-red-600">Booked</span>
                                  {bookedBy && <p className="text-[9px] sm:text-xs text-red-700 truncate max-w-full px-1">{bookedBy}</p>}
                                  {slot.duration >= 1 && (
                                    <span className="text-[9px] sm:text-xs text-red-500">
                                      {slot.duration === 0.5 ? '30 min' : `${slot.duration} hour${slot.duration !== 1 ? 's' : ''}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {selectedSlot && selectedCourt && (
          <div className="absolute bottom-20 left-0 right-0 md:left-6 md:right-6 md:bottom-6 bg-gradient-to-br from-green-50 to-green-100 p-2.5 sm:p-3 md:p-4 border-t-2 md:border-2 border-green-200 shadow-2xl z-20 md:rounded-xl">
            <h3 className="font-bold text-sm sm:text-base md:text-lg text-black mb-2 md:mb-3">Booking Summary</h3>
            <div className="space-y-1 sm:space-y-1.5 mb-2 sm:mb-3 text-xs sm:text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-black">Court:</span>
                <span className="font-semibold text-black text-right">{selectedCourt.name}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-black">Date:</span>
                <span className="font-semibold text-black text-right">{selectedDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-black">Time:</span>
                <span className="font-semibold text-black text-right">
                  {selectedSlot.time} - {calculateEndTime(selectedSlot.time, selectedSlot.duration)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-black">Duration:</span>
                <span className="font-semibold text-black text-right">{selectedSlot.duration === 0.5 ? '30 minutes' : `${selectedSlot.duration} hour${selectedSlot.duration !== 1 ? 's' : ''}`}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-green-200 mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm md:text-base font-bold text-black">Total:</span>
              <span className="text-base sm:text-lg md:text-xl font-bold text-black">${totalCost.toFixed(2)}</span>
            </div>
            <button
              onClick={handleBooking}
              disabled={bookingInProgress}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 sm:py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base"
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
        )}
      </div>
    </div>
  );
}
