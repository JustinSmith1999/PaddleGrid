import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ExtendBookingRequest {
  booking_id: string;
  duration_hours?: number;
  accept_alternative?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { booking_id, duration_hours = 1, accept_alternative = true }: ExtendBookingRequest = await req.json();

    // Get the original booking
    const { data: originalBooking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*, courts(id, name, facility_id, hourly_rate)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !originalBooking) {
      throw new Error('Booking not found');
    }

    // Verify user owns this booking
    if (originalBooking.user_id !== user.id) {
      throw new Error('Not authorized to extend this booking');
    }

    // Check if the original court is available
    const { data: canExtend } = await supabaseAdmin
      .rpc('can_extend_booking', {
        p_court_id: originalBooking.court_id,
        p_end_time: originalBooking.end_time,
        p_duration_hours: duration_hours
      });

    let extensionResult: any = {
      success: false,
      original_booking_id: booking_id,
      extension_type: 'none'
    };

    if (canExtend) {
      // Same court is available - create extension booking
      const newEndTime = new Date(new Date(originalBooking.end_time).getTime() + duration_hours * 60 * 60 * 1000);
      const cost = originalBooking.courts.hourly_rate * duration_hours;

      const { data: newBooking, error: createError } = await supabaseAdmin
        .from('bookings')
        .insert({
          user_id: user.id,
          court_id: originalBooking.court_id,
          start_time: originalBooking.end_time,
          end_time: newEndTime.toISOString(),
          status: 'confirmed',
          total_cost: cost,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Record the extension
      await supabaseAdmin
        .from('booking_extensions')
        .insert({
          original_booking_id: booking_id,
          new_booking_id: newBooking.id,
          user_id: user.id,
          status: 'approved',
          processed_at: new Date().toISOString()
        });

      extensionResult = {
        success: true,
        extension_type: 'same_court',
        new_booking: newBooking,
        court_name: originalBooking.courts.name,
        cost: cost
      };
    } else if (accept_alternative) {
      // Find alternative court
      const { data: alternatives, error: altError } = await supabaseAdmin
        .rpc('find_nearest_available_court', {
          p_facility_id: originalBooking.courts.facility_id,
          p_start_time: originalBooking.end_time,
          p_duration_hours: duration_hours,
          p_exclude_court_id: originalBooking.court_id
        });

      if (altError || !alternatives || alternatives.length === 0) {
        // No alternatives available
        await supabaseAdmin
          .from('booking_extensions')
          .insert({
            original_booking_id: booking_id,
            user_id: user.id,
            status: 'rejected',
            processed_at: new Date().toISOString(),
            metadata: { reason: 'no_availability' }
          });

        extensionResult = {
          success: false,
          extension_type: 'no_availability',
          message: 'No courts available for extension'
        };
      } else {
        const altCourt = alternatives[0];
        const newEndTime = new Date(new Date(originalBooking.end_time).getTime() + duration_hours * 60 * 60 * 1000);
        const cost = altCourt.hourly_rate * duration_hours;

        // Create booking on alternative court
        const { data: newBooking, error: createError } = await supabaseAdmin
          .from('bookings')
          .insert({
            user_id: user.id,
            court_id: altCourt.court_id,
            start_time: originalBooking.end_time,
            end_time: newEndTime.toISOString(),
            status: 'confirmed',
            total_cost: cost,
            payment_status: 'pending'
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        // Record the extension with alternative
        await supabaseAdmin
          .from('booking_extensions')
          .insert({
            original_booking_id: booking_id,
            new_booking_id: newBooking.id,
            alternative_court_id: altCourt.court_id,
            user_id: user.id,
            status: 'alternative_offered',
            processed_at: new Date().toISOString()
          });

        extensionResult = {
          success: true,
          extension_type: 'alternative_court',
          new_booking: newBooking,
          court_name: altCourt.court_name,
          original_court_name: originalBooking.courts.name,
          cost: cost
        };
      }
    } else {
      // User doesn't accept alternatives and same court unavailable
      await supabaseAdmin
        .from('booking_extensions')
        .insert({
          original_booking_id: booking_id,
          user_id: user.id,
          status: 'rejected',
          processed_at: new Date().toISOString(),
          metadata: { reason: 'same_court_unavailable' }
        });

      extensionResult = {
        success: false,
        extension_type: 'same_court_unavailable',
        message: 'Your court is not available and alternatives were not accepted'
      };
    }

    return new Response(
      JSON.stringify(extensionResult),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error extending booking:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});