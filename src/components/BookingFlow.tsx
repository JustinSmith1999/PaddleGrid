import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ArrowLeft, ChevronRight, Building2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type BookingStep = 'club' | 'court' | 'datetime' | 'confirm';

interface Facility {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  logo_url: string | null;
}

interface Court {
  id: string;
  name: string;
  facility_id: string;
  hourly_rate: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export function BookingFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<BookingStep>('club');
  const [loading, setLoading] = useState(false);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(1);

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      fetchFacilities();
    }
  }, [user]);

  useEffect(() => {
    if (selectedFacility && step === 'court') {
      fetchCourts();
    }
  }, [selectedFacility, step]);

  useEffect(() => {
    if (selectedCourt && selectedDate && step === 'datetime') {
      fetchAvailableSlots();
    }
  }, [selectedCourt, selectedDate, step]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name, city, state, logo_url')
        .order('name');

      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourts = async () => {
    if (!selectedFacility) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, facility_id, hourly_rate')
        .eq('facility_id', selectedFacility.id)
        .order('name');

      if (error) throw error;
      setCourts(data || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedCourt || !selectedDate) return;

    setLoading(true);
    try {
      const slots: TimeSlot[] = [];
      for (let hour = 6; hour <= 21; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

        const { data: existingBookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('court_id', selectedCourt.id)
          .eq('booking_date', selectedDate)
          .or(`and(start_time.lte.${time},end_time.gt.${time}),and(start_time.lt.${endTime},end_time.gte.${endTime})`)
          .limit(1);

        slots.push({
          time,
          available: !existingBookings || existingBookings.length === 0
        });
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFacilitySelect = (facility: Facility) => {
    setSelectedFacility(facility);
    setSelectedCourt(null);
    setSelectedDate('');
    setSelectedTime('');
    setStep('court');
  };

  const handleCourtSelect = (court: Court) => {
    setSelectedCourt(court);
    setSelectedDate('');
    setSelectedTime('');
    setStep('datetime');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
  };

  const handleBack = () => {
    if (step === 'court') {
      setStep('club');
      setSelectedFacility(null);
    } else if (step === 'datetime') {
      setStep('court');
      setSelectedCourt(null);
    } else if (step === 'confirm') {
      setStep('datetime');
      setSelectedTime('');
    }
  };

  const handleBooking = async () => {
    if (!selectedCourt || !selectedDate || !selectedTime || !user) return;

    setLoading(true);
    try {
      const startTime = selectedTime;
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHour = hours + duration;
      const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const totalAmount = (selectedCourt.hourly_rate || 0) * duration;

      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          court_id: selectedCourt.id,
          booking_date: selectedDate,
          start_time: startTime,
          end_time: endTime,
          duration_hours: duration,
          total_amount: totalAmount,
          status: 'confirmed',
          payment_status: 'pending'
        });

      if (error) throw error;

      alert('Booking created successfully!');
      setStep('club');
      setSelectedFacility(null);
      setSelectedCourt(null);
      setSelectedDate('');
      setSelectedTime('');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const formatTime = (time: string) => {
    const [hours] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:00 ${period}`;
  };

  if (loading && step === 'club') {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {step !== 'club' && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-emerald-700 font-medium mb-6 hover:text-emerald-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}

        {step === 'club' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-4 shadow-xl">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Book a Court</h1>
              <p className="text-slate-600">Select a club to get started</p>
            </div>

            <div className="space-y-3">
              {facilities.map((facility) => (
                <button
                  key={facility.id}
                  onClick={() => handleFacilitySelect(facility)}
                  className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all text-left flex items-center gap-4 group"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                    {facility.logo_url ? (
                      <img src={facility.logo_url} alt={facility.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Building2 className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">
                      {facility.name}
                    </h3>
                    {facility.city && (
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <MapPin className="w-4 h-4" />
                        {facility.city}{facility.state && `, ${facility.state}`}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'court' && selectedFacility && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Selected Club</p>
                  <h2 className="text-xl font-bold text-slate-900">{selectedFacility.name}</h2>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Select a Court</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                ) : courts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                    <p className="text-slate-500">No courts available at this club</p>
                  </div>
                ) : (
                  courts.map((court) => (
                    <button
                      key={court.id}
                      onClick={() => handleCourtSelect(court)}
                      className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all text-left flex items-center justify-between group"
                    >
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">
                          {court.name}
                        </h4>
                        <p className="text-sm font-medium text-emerald-600">
                          ${court.hourly_rate}/hour
                        </p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'datetime' && selectedCourt && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500 font-medium mb-1">Selected Court</p>
              <h2 className="text-xl font-bold text-slate-900">{selectedCourt.name}</h2>
              <p className="text-sm font-medium text-emerald-600 mt-1">
                ${selectedCourt.hourly_rate}/hour
              </p>
            </div>

            <div>
              <label className="block text-lg font-bold text-slate-900 mb-3">
                <Calendar className="inline w-5 h-5 mr-2" />
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                min={getMinDate()}
                className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
              />
            </div>

            {selectedDate && (
              <>
                <div>
                  <label className="block text-lg font-bold text-slate-900 mb-3">
                    <Clock className="inline w-5 h-5 mr-2" />
                    Select Time
                  </label>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && handleTimeSelect(slot.time)}
                          disabled={!slot.available}
                          className={`p-4 rounded-xl font-semibold transition-all ${
                            slot.available
                              ? 'bg-white border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-900'
                              : 'bg-slate-100 border-2 border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {formatTime(slot.time)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-lg font-bold text-slate-900 mb-3">
                    Duration
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 1.5, 2].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setDuration(hours)}
                        className={`p-4 rounded-xl font-semibold transition-all ${
                          duration === hours
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-white border-2 border-slate-200 hover:border-emerald-300 text-slate-900'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'confirm' && selectedCourt && selectedDate && selectedTime && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-4 shadow-xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Confirm Booking</h2>
              <p className="text-slate-600">Review your booking details</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Club</p>
                  <p className="text-lg font-bold text-slate-900">{selectedFacility?.name}</p>
                </div>
              </div>

              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Court</p>
                  <p className="text-lg font-bold text-slate-900">{selectedCourt.name}</p>
                </div>
              </div>

              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Date & Time</p>
                  <p className="text-lg font-bold text-slate-900">
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-md text-slate-700 mt-1">{formatTime(selectedTime)}</p>
                </div>
              </div>

              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Duration</p>
                  <p className="text-lg font-bold text-slate-900">{duration} hour{duration !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-lg font-bold text-slate-900">Total</p>
                <p className="text-3xl font-bold text-emerald-600">
                  ${((selectedCourt.hourly_rate || 0) * duration).toFixed(2)}
                </p>
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
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
