import { supabase } from './supabase';
import { PodPlayClient, PodPlayBooking, PodPlayMember, PodPlayEvent } from './podplayClient';

export interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

export async function syncPodPlayBookings(
  client: PodPlayClient,
  facilityId: string,
  startDate?: string,
  endDate?: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  try {
    const podplayBookings = await client.fetchBookings(startDate, endDate);

    const { data: facilityConfig } = await supabase
      .from('podplay_facilities')
      .select('id')
      .eq('facility_id', facilityId)
      .single();

    if (!facilityConfig) {
      throw new Error('PodPlay facility configuration not found');
    }

    for (const podplayBooking of podplayBookings) {
      try {
        const existingMapping = await supabase
          .from('podplay_bookings')
          .select('booking_id')
          .eq('podplay_booking_id', podplayBooking.id)
          .eq('podplay_facility_id', facilityConfig.id)
          .maybeSingle();

        if (existingMapping.data) {
          await updateLocalBookingFromPodPlay(existingMapping.data.booking_id, podplayBooking);
          result.updated++;
        } else {
          await createLocalBookingFromPodPlay(
            facilityId,
            facilityConfig.id,
            podplayBooking
          );
          result.created++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Failed to sync booking ${podplayBooking.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    await supabase
      .from('podplay_facilities')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', facilityConfig.id);

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

async function createLocalBookingFromPodPlay(
  facilityId: string,
  podplayFacilityId: string,
  podplayBooking: PodPlayBooking
): Promise<void> {
  const { data: courts } = await supabase
    .from('courts')
    .select('id')
    .eq('facility_id', facilityId)
    .limit(1)
    .single();

  if (!courts) {
    throw new Error('No courts found for facility');
  }

  const { data: member } = await supabase
    .from('podplay_members')
    .select('user_id')
    .eq('podplay_member_id', podplayBooking.memberId)
    .eq('podplay_facility_id', podplayFacilityId)
    .maybeSingle();

  if (!member) {
    return;
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      court_id: courts.id,
      user_id: member.user_id,
      booking_date: podplayBooking.date,
      start_time: podplayBooking.startTime,
      end_time: podplayBooking.endTime,
      status: podplayBooking.status,
      total_amount: podplayBooking.amount || 0,
      duration_hours: calculateDuration(podplayBooking.startTime, podplayBooking.endTime),
      notes: podplayBooking.notes,
    })
    .select()
    .single();

  if (bookingError) throw bookingError;

  await supabase.from('podplay_bookings').insert({
    booking_id: booking.id,
    podplay_booking_id: podplayBooking.id,
    podplay_facility_id: podplayFacilityId,
    podplay_data: podplayBooking,
  });
}

async function updateLocalBookingFromPodPlay(
  bookingId: string,
  podplayBooking: PodPlayBooking
): Promise<void> {
  await supabase
    .from('bookings')
    .update({
      booking_date: podplayBooking.date,
      start_time: podplayBooking.startTime,
      end_time: podplayBooking.endTime,
      status: podplayBooking.status,
      total_amount: podplayBooking.amount || 0,
      duration_hours: calculateDuration(podplayBooking.startTime, podplayBooking.endTime),
      notes: podplayBooking.notes,
    })
    .eq('id', bookingId);

  await supabase
    .from('podplay_bookings')
    .update({
      podplay_data: podplayBooking,
      last_synced_at: new Date().toISOString(),
    })
    .eq('booking_id', bookingId);
}

export async function syncPodPlayMembers(
  client: PodPlayClient,
  facilityId: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  try {
    const podplayMembers = await client.fetchMembers();

    const { data: facilityConfig } = await supabase
      .from('podplay_facilities')
      .select('id, auto_create_members')
      .eq('facility_id', facilityId)
      .single();

    if (!facilityConfig) {
      throw new Error('PodPlay facility configuration not found');
    }

    for (const podplayMember of podplayMembers) {
      try {
        const existingMapping = await supabase
          .from('podplay_members')
          .select('user_id')
          .eq('podplay_member_id', podplayMember.id)
          .eq('podplay_facility_id', facilityConfig.id)
          .maybeSingle();

        if (existingMapping.data) {
          await updateLocalMemberFromPodPlay(existingMapping.data.user_id, podplayMember);
          result.updated++;
        } else if (facilityConfig.auto_create_members) {
          await createLocalMemberFromPodPlay(
            facilityId,
            facilityConfig.id,
            podplayMember
          );
          result.created++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Failed to sync member ${podplayMember.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

async function createLocalMemberFromPodPlay(
  facilityId: string,
  podplayFacilityId: string,
  podplayMember: PodPlayMember
): Promise<void> {
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', podplayMember.email)
    .maybeSingle();

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: preRegistered } = await supabase
      .from('pre_registered_users')
      .insert({
        email: podplayMember.email,
        first_name: podplayMember.firstName,
        last_name: podplayMember.lastName,
        phone: podplayMember.phone,
        facility_id: facilityId,
        source: 'podplay_sync',
      })
      .select()
      .single();

    if (!preRegistered) {
      throw new Error('Failed to create pre-registered user');
    }

    return;
  }

  await supabase.from('podplay_members').insert({
    user_id: userId,
    podplay_member_id: podplayMember.id,
    podplay_facility_id: podplayFacilityId,
    email: podplayMember.email,
    membership_type: podplayMember.membershipType,
    membership_status: podplayMember.membershipStatus,
    membership_expires_at: podplayMember.membershipExpiresAt,
    podplay_data: podplayMember,
  });

  await supabase.from('facility_users').insert({
    facility_id: facilityId,
    user_id: userId,
    role: 'member',
  }).onConflict('facility_id,user_id').ignoreDuplicates();
}

async function updateLocalMemberFromPodPlay(
  userId: string,
  podplayMember: PodPlayMember
): Promise<void> {
  await supabase
    .from('profiles')
    .update({
      first_name: podplayMember.firstName,
      last_name: podplayMember.lastName,
      phone: podplayMember.phone,
    })
    .eq('id', userId);

  await supabase
    .from('podplay_members')
    .update({
      membership_type: podplayMember.membershipType,
      membership_status: podplayMember.membershipStatus,
      membership_expires_at: podplayMember.membershipExpiresAt,
      podplay_data: podplayMember,
      last_synced_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

export async function syncPodPlayEvents(
  client: PodPlayClient,
  facilityId: string,
  startDate?: string,
  endDate?: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  try {
    const podplayEvents = await client.fetchEvents(startDate, endDate);

    const { data: facilityConfig } = await supabase
      .from('podplay_facilities')
      .select('id')
      .eq('facility_id', facilityId)
      .single();

    if (!facilityConfig) {
      throw new Error('PodPlay facility configuration not found');
    }

    for (const podplayEvent of podplayEvents) {
      try {
        const existingMapping = await supabase
          .from('podplay_events')
          .select('event_series_id')
          .eq('podplay_event_id', podplayEvent.id)
          .eq('podplay_facility_id', facilityConfig.id)
          .maybeSingle();

        if (existingMapping.data) {
          await updateLocalEventFromPodPlay(existingMapping.data.event_series_id, podplayEvent);
          result.updated++;
        } else {
          await createLocalEventFromPodPlay(
            facilityId,
            facilityConfig.id,
            podplayEvent
          );
          result.created++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Failed to sync event ${podplayEvent.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

async function createLocalEventFromPodPlay(
  facilityId: string,
  podplayFacilityId: string,
  podplayEvent: PodPlayEvent
): Promise<void> {
  const { data: eventSeries, error: seriesError } = await supabase
    .from('event_series')
    .insert({
      facility_id: facilityId,
      name: podplayEvent.name,
      description: podplayEvent.description,
      start_date: podplayEvent.startDate,
      end_date: podplayEvent.endDate,
      registration_deadline: podplayEvent.registrationDeadline,
      max_participants: podplayEvent.maxParticipants,
      price: podplayEvent.price || 0,
      is_active: true,
    })
    .select()
    .single();

  if (seriesError) throw seriesError;

  await supabase.from('podplay_events').insert({
    event_series_id: eventSeries.id,
    podplay_event_id: podplayEvent.id,
    podplay_facility_id: podplayFacilityId,
    event_type: podplayEvent.type,
    podplay_data: podplayEvent,
  });
}

async function updateLocalEventFromPodPlay(
  eventSeriesId: string,
  podplayEvent: PodPlayEvent
): Promise<void> {
  await supabase
    .from('event_series')
    .update({
      name: podplayEvent.name,
      description: podplayEvent.description,
      start_date: podplayEvent.startDate,
      end_date: podplayEvent.endDate,
      registration_deadline: podplayEvent.registrationDeadline,
      max_participants: podplayEvent.maxParticipants,
      price: podplayEvent.price || 0,
    })
    .eq('id', eventSeriesId);

  await supabase
    .from('podplay_events')
    .update({
      podplay_data: podplayEvent,
      last_synced_at: new Date().toISOString(),
    })
    .eq('event_series_id', eventSeriesId);
}

export async function pushBookingToPodPlay(
  bookingId: string,
  facilityId: string
): Promise<void> {
  const client = await import('./podplayClient').then(m => m.getPodPlayClient(facilityId));
  if (!client) {
    throw new Error('PodPlay integration not configured');
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, courts(*), profiles(*)')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    throw new Error('Booking not found');
  }

  const { data: memberMapping } = await supabase
    .from('podplay_members')
    .select('podplay_member_id')
    .eq('user_id', booking.user_id)
    .maybeSingle();

  if (!memberMapping) {
    throw new Error('Member not synced with PodPlay');
  }

  const podplayBooking = await client.createBooking({
    memberId: memberMapping.podplay_member_id,
    courtId: booking.courts.courtreserve_court_id || booking.court_id,
    date: booking.booking_date,
    startTime: booking.start_time,
    endTime: booking.end_time,
    status: booking.status,
    amount: booking.total_amount,
    notes: booking.notes,
  });

  const { data: facilityConfig } = await supabase
    .from('podplay_facilities')
    .select('id')
    .eq('facility_id', facilityId)
    .single();

  if (facilityConfig) {
    await supabase.from('podplay_bookings').insert({
      booking_id: bookingId,
      podplay_booking_id: podplayBooking.id,
      podplay_facility_id: facilityConfig.id,
      podplay_data: podplayBooking,
    });
  }
}

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}
