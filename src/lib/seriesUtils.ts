import { supabase } from './supabase';

export interface CourtConflict {
  courtId: string;
  date: string;
  time: string;
  conflictWith: string;
}

export interface SeriesStats {
  totalOccurrences: number;
  completedOccurrences: number;
  upcomingOccurrences: number;
  totalRegistrations: number;
  totalRevenue: number;
  uniqueParticipants: number;
  averageAttendanceRate: number;
}

export async function checkCourtAvailability(
  courtId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeOccurrenceId?: string
): Promise<{ available: boolean; conflicts: any[] }> {
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('court_id', courtId)
    .eq('date', date)
    .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`)
    .neq('status', 'cancelled');

  if (bookingError) throw bookingError;

  const { data: occurrences, error: occError } = await supabase
    .from('event_series_occurrences')
    .select('*, event_series(*)')
    .eq('court_id', courtId)
    .eq('occurrence_date', date)
    .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`)
    .neq('status', 'cancelled');

  if (occError) throw occError;

  const filteredOccurrences = occurrences?.filter(
    occ => occ.id !== excludeOccurrenceId
  ) || [];

  const allConflicts = [
    ...(bookings || []).map(b => ({ type: 'booking', ...b })),
    ...filteredOccurrences.map(o => ({ type: 'series', ...o }))
  ];

  return {
    available: allConflicts.length === 0,
    conflicts: allConflicts
  };
}

export function generateOccurrenceDates(
  startDate: Date,
  endDate: Date,
  daysOfWeek: number[]
): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    if (daysOfWeek.includes(current.getDay())) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export async function getSeriesStats(seriesId: string): Promise<SeriesStats> {
  const { data, error } = await supabase
    .rpc('get_series_stats', { p_series_id: seriesId });

  if (error) throw error;

  return {
    totalOccurrences: data.total_occurrences || 0,
    completedOccurrences: data.completed_occurrences || 0,
    upcomingOccurrences: data.upcoming_occurrences || 0,
    totalRegistrations: data.total_registrations || 0,
    totalRevenue: parseFloat(data.total_revenue) || 0,
    uniqueParticipants: data.unique_participants || 0,
    averageAttendanceRate: parseFloat(data.average_attendance_rate) || 0
  };
}

export async function canUserRegister(
  userId: string,
  occurrenceId: string
): Promise<{ canRegister: boolean; reason?: string }> {
  const { data: occurrence, error: occError } = await supabase
    .from('event_series_occurrences')
    .select('*, event_series(*)')
    .eq('id', occurrenceId)
    .single();

  if (occError || !occurrence) {
    return { canRegister: false, reason: 'Occurrence not found' };
  }

  if (occurrence.status !== 'scheduled') {
    return { canRegister: false, reason: 'This session is not available for registration' };
  }

  const occDate = new Date(occurrence.occurrence_date);
  const occTime = occurrence.start_time.split(':');
  occDate.setHours(parseInt(occTime[0]), parseInt(occTime[1]));

  const now = new Date();
  const deadlineHours = occurrence.event_series.registration_deadline_hours || 2;
  const deadline = new Date(occDate.getTime() - deadlineHours * 60 * 60 * 1000);

  if (now > deadline) {
    return { canRegister: false, reason: 'Registration deadline has passed' };
  }

  const { data: existingReg, error: regError } = await supabase
    .from('event_series_registrations')
    .select('*')
    .eq('occurrence_id', occurrenceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (regError) throw regError;

  if (existingReg) {
    return { canRegister: false, reason: 'You are already registered for this session' };
  }

  if (occurrence.current_registrants >= occurrence.max_participants) {
    if (occurrence.event_series.enable_waitlist) {
      return { canRegister: true, reason: 'Waitlist available' };
    }
    return { canRegister: false, reason: 'Session is full' };
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('skill_level')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    return { canRegister: true };
  }

  const userSkill = userProfile.skill_level || 0;
  const minSkill = occurrence.event_series.skill_level_min || 0;
  const maxSkill = occurrence.event_series.skill_level_max || 7;

  if (userSkill < minSkill || userSkill > maxSkill) {
    return {
      canRegister: false,
      reason: `This series is for skill levels ${minSkill} - ${maxSkill}`
    };
  }

  return { canRegister: true };
}

export async function registerForOccurrence(
  userId: string,
  occurrenceId: string,
  paymentIntentId?: string
): Promise<{ success: boolean; registrationId?: string; error?: string }> {
  const eligibility = await canUserRegister(userId, occurrenceId);

  if (!eligibility.canRegister && eligibility.reason !== 'Waitlist available') {
    return { success: false, error: eligibility.reason };
  }

  const { data: occurrence, error: occError } = await supabase
    .from('event_series_occurrences')
    .select('*, event_series(*)')
    .eq('id', occurrenceId)
    .single();

  if (occError || !occurrence) {
    return { success: false, error: 'Occurrence not found' };
  }

  const isFull = occurrence.current_registrants >= occurrence.max_participants;
  const status = isFull ? 'waitlisted' : 'registered';
  const price = occurrence.custom_price || occurrence.event_series.price_per_session;

  const { data: registration, error: regError } = await supabase
    .from('event_series_registrations')
    .insert({
      series_id: occurrence.series_id,
      occurrence_id: occurrenceId,
      user_id: userId,
      status,
      amount_paid: status === 'registered' ? price : 0,
      payment_status: status === 'registered' ? 'completed' : 'pending',
      stripe_payment_intent_id: paymentIntentId,
      waitlist_position: isFull ? occurrence.waitlist_count + 1 : null
    })
    .select()
    .single();

  if (regError) {
    return { success: false, error: regError.message };
  }

  return { success: true, registrationId: registration.id };
}

export async function cancelRegistration(
  registrationId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: registration, error: fetchError } = await supabase
    .from('event_series_registrations')
    .select('*, event_series_occurrences(*)')
    .eq('id', registrationId)
    .single();

  if (fetchError || !registration) {
    return { success: false, error: 'Registration not found' };
  }

  const occDate = new Date(registration.event_series_occurrences.occurrence_date);
  const now = new Date();

  if (occDate < now) {
    return { success: false, error: 'Cannot cancel past events' };
  }

  const { error: updateError } = await supabase
    .from('event_series_registrations')
    .update({ status: 'cancelled' })
    .eq('id', registrationId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function checkInParticipant(
  registrationId: string,
  checkedInBy: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('event_series_registrations')
    .update({
      status: 'attended',
      checked_in_at: new Date().toISOString(),
      checked_in_by: checkedInBy
    })
    .eq('id', registrationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export function calculateSeriesPrice(
  pricePerSession: number,
  numberOfSessions: number,
  discountPercentage: number = 0
): number {
  const totalPrice = pricePerSession * numberOfSessions;
  const discount = totalPrice * (discountPercentage / 100);
  return totalPrice - discount;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

export function getOccurrenceStatus(
  occurrence: any
): 'upcoming' | 'today' | 'past' | 'cancelled' | 'completed' {
  if (occurrence.status === 'cancelled') return 'cancelled';
  if (occurrence.status === 'completed') return 'completed';

  const occDate = new Date(occurrence.occurrence_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  occDate.setHours(0, 0, 0, 0);

  if (occDate.getTime() === today.getTime()) return 'today';
  if (occDate < today) return 'past';
  return 'upcoming';
}
