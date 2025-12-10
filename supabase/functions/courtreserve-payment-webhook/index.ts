import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CourtReserveWebhookPayload {
  event_type?: string;
  booking_id?: string;
  reservation_id?: string;
  payment_status?: string;
  status?: string;
  amount?: number;
  currency?: string;
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

    const webhookData: CourtReserveWebhookPayload = await req.json();
    console.info('Received CourtReserve webhook:', webhookData);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const bookingId = webhookData.booking_id || webhookData.reservation_id;

    if (!bookingId) {
      console.warn('No booking ID found in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Missing booking ID' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('courtreserve_booking_id', bookingId)
      .maybeSingle();

    if (fetchError || !booking) {
      console.error('Booking not found:', bookingId, fetchError);
      return new Response(
        JSON.stringify({ error: 'Booking not found', details: fetchError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isPaid = webhookData.payment_status === 'paid' ||
                   webhookData.payment_status === 'completed' ||
                   webhookData.status === 'confirmed';

    if (isPaid) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('Failed to update booking:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update booking', details: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.info(`Successfully confirmed booking ${booking.id} after CourtReserve payment`);
    } else {
      console.info(`Webhook received for booking ${booking.id} but payment not confirmed. Status: ${webhookData.payment_status || webhookData.status}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        booking_id: booking.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
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
