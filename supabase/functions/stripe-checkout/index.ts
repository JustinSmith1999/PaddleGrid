import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createRequestLogger } from '../_shared/logger.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  // For 204 No Content, don't include Content-Type or body
  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  const log = createRequestLogger('stripe-checkout', req);

  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { price_id, success_url, cancel_url, mode, type, postId, bookingId, amount, lineItems, metadata } = await req.json();

    if (type === 'match_payment') {
      if (!postId || !bookingId || !amount || !success_url || !cancel_url) {
        return corsResponse({ error: 'Missing required parameters for match payment' }, 400);
      }
    } else if (type === 'merch_purchase') {
      if (!lineItems || !success_url || !cancel_url) {
        return corsResponse({ error: 'Missing required parameters for merch purchase' }, 400);
      }
    } else {
      const error = validateParameters(
        { price_id, success_url, cancel_url, mode },
        {
          cancel_url: 'string',
          price_id: 'string',
          success_url: 'string',
          mode: { values: ['payment', 'subscription'] },
        },
      );

      if (error) {
        return corsResponse({ error }, 400);
      }
    }

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    if (!user) {
      return corsResponse({ error: 'User not found' }, 404);
    }

    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (getCustomerError) {
      log.error('Failed to fetch customer information from the database', { error: getCustomerError });

      return corsResponse({ error: 'Failed to fetch customer information' }, 500);
    }

    let customerId;

    /**
     * In case we don't have a mapping yet, the customer does not exist and we need to create one.
     */
    if (!customer || !customer.customer_id) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      log.info('Created new Stripe customer', { stripe_customer_id: newCustomer.id, user_id: user.id });

      const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
        user_id: user.id,
        customer_id: newCustomer.id,
      });

      if (createCustomerError) {
        log.error('Failed to save customer information in the database', { error: createCustomerError });

        // Try to clean up both the Stripe customer and subscription record
        try {
          await stripe.customers.del(newCustomer.id);
          await supabase.from('stripe_subscriptions').delete().eq('customer_id', newCustomer.id);
        } catch (deleteError) {
          log.error('Failed to clean up after customer mapping error', { error: deleteError });
        }

        return corsResponse({ error: 'Failed to create customer mapping' }, 500);
      }

      if (mode === 'subscription') {
        const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
          customer_id: newCustomer.id,
          status: 'not_started',
        });

        if (createSubscriptionError) {
          log.error('Failed to save subscription in the database', { error: createSubscriptionError });

          // Try to clean up the Stripe customer since we couldn't create the subscription
          try {
            await stripe.customers.del(newCustomer.id);
          } catch (deleteError) {
            log.error('Failed to delete Stripe customer after subscription creation error', { error: deleteError });
          }

          return corsResponse({ error: 'Unable to save the subscription in the database' }, 500);
        }
      }

      customerId = newCustomer.id;

      log.info('Successfully set up new customer with subscription record', { customer_id: customerId });
    } else {
      customerId = customer.customer_id;

      if (mode === 'subscription') {
        // Verify subscription exists for existing customer
        const { data: subscription, error: getSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('status')
          .eq('customer_id', customerId)
          .maybeSingle();

        if (getSubscriptionError) {
          log.error('Failed to fetch subscription information from the database', { error: getSubscriptionError });

          return corsResponse({ error: 'Failed to fetch subscription information' }, 500);
        }

        if (!subscription) {
          // Create subscription record for existing customer if missing
          const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
            customer_id: customerId,
            status: 'not_started',
          });

          if (createSubscriptionError) {
            log.error('Failed to create subscription record for existing customer', { error: createSubscriptionError });

            return corsResponse({ error: 'Failed to create subscription record for existing customer' }, 500);
          }
        }
      }
    }

    // create Checkout Session
    let sessionConfig: any = {
      customer: customerId,
      payment_method_types: ['card'],
      success_url,
      cancel_url,
    };

    if (type === 'match_payment') {
      sessionConfig = {
        ...sessionConfig,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Court Booking - Match Payment',
                description: 'Your share of the court booking fee',
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'match_payment',
          post_id: postId,
          booking_id: bookingId,
          user_id: user.id,
        },
      };
    } else if (type === 'merch_purchase') {
      sessionConfig = {
        ...sessionConfig,
        mode: 'payment',
        line_items: lineItems,
        metadata: {
          ...metadata,
          type: 'merch_purchase',
          user_id: user.id,
        },
      };
    } else {
      sessionConfig = {
        ...sessionConfig,
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        mode,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    log.info('Created checkout session', { session_id: session.id, customer_id: customerId, type: type ?? mode });

    return corsResponse({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    log.error('Checkout error', { error });
    return corsResponse({ error: error.message }, 500);
  }
});

type ExpectedType = 'string' | { values: string[] };
type Expectations<T> = { [K in keyof T]: ExpectedType };

function validateParameters<T extends Record<string, any>>(values: T, expected: Expectations<T>): string | undefined {
  for (const parameter in values) {
    const expectation = expected[parameter];
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }

  return undefined;
}