import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@14.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname.replace('/stripe-payments', '');

    if (path === '/create-payment-intent' && req.method === 'POST') {
      const { bookingId, amount, currency = 'usd', metadata = {} } = await req.json();

      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        throw new Error('Unauthorized');
      }

      const { data: booking } = await supabase
        .from('bookings')
        .select('court_id, courts(facility_id), facilities(stripe_account_id)')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        throw new Error('Booking not found');
      }

      const stripeAccountId = booking.facilities?.stripe_account_id;
      const facilityId = booking.courts?.facility_id;

      const paymentIntentParams: any = {
        amount: Math.round(amount * 100),
        currency,
        metadata: {
          bookingId,
          userId: user.id,
          facilityId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      if (stripeAccountId) {
        paymentIntentParams.transfer_data = {
          destination: stripeAccountId,
        };
        paymentIntentParams.application_fee_amount = Math.round(amount * 100 * 0.05);
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      await supabase
        .from('payment_transactions')
        .insert({
          booking_id: bookingId,
          user_id: user.id,
          amount,
          currency,
          stripe_payment_intent_id: paymentIntent.id,
          status: 'pending',
          metadata,
        });

      await supabase
        .from('bookings')
        .update({
          payment_intent_id: paymentIntent.id,
          payment_status: 'pending',
        })
        .eq('id', bookingId);

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (path === '/create-series-payment-intent' && req.method === 'POST') {
      const { seriesId, occurrenceIds, amount, currency = 'usd', metadata = {} } = await req.json();

      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        throw new Error('Unauthorized');
      }

      const { data: series } = await supabase
        .from('event_series')
        .select('facility_id, facilities(stripe_account_id)')
        .eq('id', seriesId)
        .single();

      if (!series) {
        throw new Error('Series not found');
      }

      const stripeAccountId = series.facilities?.stripe_account_id;

      const paymentIntentParams: any = {
        amount: Math.round(amount * 100),
        currency,
        metadata: {
          seriesId,
          occurrenceIds: JSON.stringify(occurrenceIds),
          userId: user.id,
          type: 'series_registration',
          facilityId: series.facility_id,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      if (stripeAccountId) {
        paymentIntentParams.transfer_data = {
          destination: stripeAccountId,
        };
        paymentIntentParams.application_fee_amount = Math.round(amount * 100 * 0.05);
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (path === '/webhook' && req.method === 'POST') {
      const signature = req.headers.get('stripe-signature');
      if (!signature) {
        throw new Error('No signature');
      }

      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      const body = await req.text();
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const { bookingId, userId, type, seriesId, occurrenceIds } = paymentIntent.metadata;

          if (type === 'series_registration') {
            const occurrenceIdArray = JSON.parse(occurrenceIds);
            const amountPerOccurrence = (paymentIntent.amount / 100) / occurrenceIdArray.length;

            for (const occurrenceId of occurrenceIdArray) {
              await supabase
                .from('event_series_registrations')
                .update({
                  payment_status: 'paid',
                  amount_paid: amountPerOccurrence,
                  stripe_payment_intent_id: paymentIntent.id,
                })
                .eq('occurrence_id', occurrenceId)
                .eq('user_id', userId);
            }
          } else {
            await supabase
              .from('payment_transactions')
              .update({
                status: 'succeeded',
                stripe_charge_id: paymentIntent.latest_charge as string,
              })
              .eq('stripe_payment_intent_id', paymentIntent.id);

            await supabase
              .from('bookings')
              .update({
                payment_status: 'paid',
                status: 'confirmed',
              })
              .eq('id', bookingId);

            const { data: booking } = await supabase
              .from('bookings')
              .select('duration_hours')
              .eq('id', bookingId)
              .single();

            if (booking) {
              await supabase.rpc('update_player_stats', {
                p_user_id: userId,
                p_amount_spent: paymentIntent.amount / 100,
                p_hours_played: booking.duration_hours,
              });
            }
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          await supabase
            .from('payment_transactions')
            .update({ status: 'failed' })
            .eq('stripe_payment_intent_id', paymentIntent.id);

          await supabase
            .from('bookings')
            .update({
              payment_status: 'pending',
              status: 'pending',
            })
            .eq('payment_intent_id', paymentIntent.id);
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;

          await supabase
            .from('payment_transactions')
            .update({ status: 'refunded' })
            .eq('stripe_charge_id', charge.id);

          const { data: transaction } = await supabase
            .from('payment_transactions')
            .select('booking_id')
            .eq('stripe_charge_id', charge.id)
            .single();

          if (transaction) {
            await supabase
              .from('bookings')
              .update({
                payment_status: 'refunded',
                status: 'cancelled',
              })
              .eq('id', transaction.booking_id);
          }
          break;
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    if (path === '/refund' && req.method === 'POST') {
      const { paymentIntentId, amount, reason = 'requested_by_customer' } = await req.json();

      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        throw new Error('Unauthorized');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'owner'].includes(profile.role)) {
        throw new Error('Insufficient permissions');
      }

      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await stripe.refunds.create(refundParams);

      return new Response(
        JSON.stringify({
          success: true,
          refundId: refund.id,
          status: refund.status,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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