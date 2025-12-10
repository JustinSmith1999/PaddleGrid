import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingRequest {
  facility_id: string;
  court_id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_amount: number;
  user_email?: string;
  user_name?: string;
  user_phone?: string;
  court_name?: string;
}

interface CourtReserveAuthResponse {
  token?: string;
  access_token?: string;
  session_id?: string;
}

interface CourtReserveBookingResponse {
  BookingID?: string;
  ReservationID?: string;
  payment_url?: string;
  checkout_url?: string;
  status?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const bookingData: BookingRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select('name')
      .eq('id', bookingData.court_id)
      .maybeSingle();

    if (courtError || !court) {
      return new Response(
        JSON.stringify({ error: 'Court not found', details: courtError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', bookingData.user_id)
      .maybeSingle();

    const userName = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : bookingData.user_name || 'Guest';

    let courtReserveBookingId = null;
    let paymentUrl = null;
    let courtReserveError = null;

    const courtReserveUsername = Deno.env.get('COURTRESERVE_USERNAME');
    const courtReservePassword = Deno.env.get('COURTRESERVE_PASSWORD');
    const courtReserveApiUrl = Deno.env.get('COURTRESERVE_API_URL') || 'https://app.courtreserve.com/Online/API';

    if (courtReserveUsername && courtReservePassword) {
      try {
        const authResponse = await fetch(`${courtReserveApiUrl}/Login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: courtReserveUsername,
            password: courtReservePassword,
          }),
        });

        if (!authResponse.ok) {
          throw new Error(`Authentication failed: ${authResponse.status}`);
        }

        const authData: CourtReserveAuthResponse = await authResponse.json();
        const authToken = authData.token || authData.access_token || authData.session_id;

        if (!authToken) {
          throw new Error('No authentication token received');
        }

        const startDateTime = `${bookingData.booking_date}T${bookingData.start_time}:00`;
        const endDateTime = `${bookingData.booking_date}T${bookingData.end_time}:00`;

        const reservationPayload = {
          CourtID: court.name,
          StartTime: startDateTime,
          EndTime: endDateTime,
          CustomerName: userName,
          CustomerEmail: bookingData.user_email,
          CustomerPhone: profile?.phone || bookingData.user_phone || '',
          Amount: bookingData.total_amount,
          Notes: `PaddleGrid Booking - ${bookingData.duration_hours} hour(s)`,
        };

        const bookingResponse = await fetch(`${courtReserveApiUrl}/Reservations/Create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(reservationPayload),
        });

        if (bookingResponse.ok) {
          const bookingResult: CourtReserveBookingResponse = await bookingResponse.json();
          courtReserveBookingId = bookingResult.BookingID || bookingResult.ReservationID;
          paymentUrl = bookingResult.payment_url || bookingResult.checkout_url;
        } else {
          const errorText = await bookingResponse.text();
          courtReserveError = `CourtReserve booking failed: ${bookingResponse.status} ${errorText}`;
          console.warn('CourtReserve booking failed:', courtReserveError);
        }
      } catch (error) {
        courtReserveError = error.message;
        console.warn('CourtReserve API error:', error);
      }
    } else {
      console.info('CourtReserve credentials not configured, proceeding with local booking only');
    }

    const bookingStatus = paymentUrl ? 'pending' : (courtReserveBookingId ? 'confirmed' : 'pending');
    const paymentStatus = paymentUrl ? 'pending' : (courtReserveBookingId ? 'paid' : 'pending');

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        court_id: bookingData.court_id,
        facility_id: bookingData.facility_id,
        user_id: bookingData.user_id,
        booking_date: bookingData.booking_date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        duration_hours: bookingData.duration_hours,
        total_amount: bookingData.total_amount,
        status: bookingStatus,
        payment_status: paymentStatus,
        courtreserve_booking_id: courtReserveBookingId,
      })
      .select()
      .single();

    if (bookingError) {
      return new Response(
        JSON.stringify({
          error: 'Failed to create booking in database',
          details: bookingError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await supabase
      .from('court_availability_blocks')
      .insert({
        court_id: bookingData.court_id,
        facility_id: bookingData.facility_id,
        block_date: bookingData.booking_date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        block_type: 'reservation',
        reason: `Booking by ${userName}`,
        is_recurring: false,
      });

    const { data: statsData } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', bookingData.user_id)
      .maybeSingle();

    if (statsData) {
      await supabase
        .from('player_stats')
        .update({
          total_bookings: statsData.total_bookings + 1,
          total_hours_played: Number(statsData.total_hours_played) + bookingData.duration_hours,
          total_spent: Number(statsData.total_spent) + bookingData.total_amount,
        })
        .eq('user_id', bookingData.user_id);
    } else {
      await supabase.from('player_stats').insert({
        user_id: bookingData.user_id,
        total_bookings: 1,
        total_hours_played: bookingData.duration_hours,
        total_spent: bookingData.total_amount,
        favorite_court_id: bookingData.court_id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking,
        courtreserve_booking_id: courtReserveBookingId,
        payment_url: paymentUrl,
        requires_payment: !!paymentUrl,
        courtreserve_synced: !!courtReserveBookingId,
        message: courtReserveBookingId
          ? (paymentUrl ? 'Booking created. Please complete payment through CourtReserve.' : 'Booking created and confirmed in CourtReserve')
          : 'Booking created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
