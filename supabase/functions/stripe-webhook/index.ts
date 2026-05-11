import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createRequestLogger, type RequestLogger } from '../_shared/logger.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const log = createRequestLogger('stripe-webhook', req);

  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      log.warn('No stripe-signature header found');
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      log.error('Webhook signature verification failed', { error });
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    log.info('Webhook event received', { event_type: event.type, event_id: event.id });

    EdgeRuntime.waitUntil(handleEvent(event, log));

    return Response.json({ received: true });
  } catch (error: any) {
    log.error('Error processing webhook', { error });
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event, log: RequestLogger) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    log.error('No customer received on event', { event_type: event.type, event_id: event.id });
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      log.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`, { customer_id: customerId });
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      log.info('Starting subscription sync', { customer_id: customerId });
      await syncCustomerFromStripe(customerId, log);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        // Extract the necessary information from the session
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
          metadata,
        } = stripeData as Stripe.Checkout.Session;

        if (metadata?.type === 'match_payment' && metadata?.post_id && metadata?.user_id) {
          const { error: participantError } = await supabase
            .from('social_post_participants')
            .insert({
              post_id: metadata.post_id,
              user_id: metadata.user_id,
            });

          if (participantError && participantError.code !== '23505') {
            log.error('Error adding match participant', { error: participantError, post_id: metadata.post_id });
          } else {
            log.info('Successfully added user to match', { user_id: metadata.user_id, post_id: metadata.post_id });
          }

          const { error: paymentError } = await supabase
            .from('match_participant_payments')
            .insert({
              post_id: metadata.post_id,
              user_id: metadata.user_id,
              booking_id: metadata.booking_id,
              amount_paid: amount_total / 100,
              payment_intent_id: payment_intent as string,
              payment_status: 'paid',
            });

          if (paymentError) {
            log.error('Error recording match payment', { error: paymentError, post_id: metadata.post_id });
          } else {
            log.info('Successfully recorded payment for match', { post_id: metadata.post_id });
          }

          try {
            const { data: post } = await supabase
              .from('social_posts')
              .select('author_id')
              .eq('id', metadata.post_id)
              .single();

            if (post && post.author_id !== metadata.user_id) {
              await supabase.rpc('create_social_notification', {
                p_user_id: post.author_id,
                p_type: 'match_join',
                p_data: { post_id: metadata.post_id, from_user_id: metadata.user_id }
              });
            }
          } catch (notifError) {
            log.warn('Failed to create match join notification', { error: notifError });
          }
        } else if (metadata?.booking_id) {
          const { error: bookingError } = await supabase
            .from('bookings')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              updated_at: new Date().toISOString(),
            })
            .eq('id', metadata.booking_id);

          if (bookingError) {
            log.error('Error updating booking', { error: bookingError, booking_id: metadata.booking_id });
          } else {
            log.info('Successfully confirmed booking', { booking_id: metadata.booking_id });
          }
        }

        // Insert the order into the stripe_orders table
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed',
        });

        if (orderError) {
          log.error('Error inserting order', { error: orderError, checkout_session_id });
          return;
        }
        log.info('Successfully processed one-time payment', { checkout_session_id });
      } catch (error) {
        log.error('Error processing one-time payment', { error });
      }
    }
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string, log: RequestLogger) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      log.info('No active subscriptions found for customer', { customer_id: customerId });
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        log.error('Error updating subscription status', { error: noSubError, customer_id: customerId });
        throw new Error('Failed to update subscription status in database');
      }
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      log.error('Error syncing subscription', { error: subError, customer_id: customerId });
      throw new Error('Failed to sync subscription in database');
    }
    log.info('Successfully synced subscription', { customer_id: customerId });
  } catch (error) {
    log.error('Failed to sync subscription', { error, customer_id: customerId });
    throw error;
  }
}
