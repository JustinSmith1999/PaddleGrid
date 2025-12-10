import { supabase, Booking } from '../lib/supabase';

export interface BookingWithDetails extends Booking {
  courts?: {
    id: string;
    name: string;
    facility_id: string;
    hourly_rate: number;
    facilities?: {
      id: string;
      name: string;
      address: string | null;
    };
  };
  profiles?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export async function createBooking(booking: {
  court_id: string;
  start_time: string;
  end_time: string;
  total_cost: number;
  notes?: string;
}): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: user.user.id,
        ...booking,
        status: 'confirmed',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, booking: data };
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserBookings(status?: string): Promise<BookingWithDetails[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    let query = supabase
      .from('bookings')
      .select(`
        *,
        courts (
          id,
          name,
          facility_id,
          hourly_rate,
          facilities (
            id,
            name,
            address
          )
        )
      `)
      .eq('user_id', user.user.id)
      .order('start_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
}

export async function getBookingById(bookingId: string): Promise<BookingWithDetails | null> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        courts (
          id,
          name,
          facility_id,
          hourly_rate,
          facilities (
            id,
            name,
            address
          )
        ),
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
}

export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (booking.user_id !== user.user.id) {
      return { success: false, error: 'Not authorized to cancel this booking' };
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return { success: false, error: error.message };
  }
}

export async function getCourtAvailability(
  courtId: string,
  date: string
): Promise<{ start_time: string; end_time: string }[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('court_id', courtId)
      .gte('start_time', `${date}T00:00:00`)
      .lt('start_time', `${date}T23:59:59`)
      .eq('status', 'confirmed')
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching court availability:', error);
    return [];
  }
}

export async function getUpcomingBookings(limit: number = 10): Promise<BookingWithDetails[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        courts (
          id,
          name,
          facility_id,
          hourly_rate,
          facilities (
            id,
            name,
            address
          )
        )
      `)
      .eq('user_id', user.user.id)
      .eq('status', 'confirmed')
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    return [];
  }
}
