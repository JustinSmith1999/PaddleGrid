/**
 * Edge function — supabase/functions/stripe-membership-checkout/index.ts
 *
 * POST { facility_id, tier_id, return_url }
 *   → { checkout_url }
 *
 * Creates a Stripe Checkout session for a facility membership tier.
 * Webhooks (stripe-webhook) handle inserting into facility_members on success.
 *
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY
 *   PADDLEGRID_PLATFORM_FEE_BPS  (optional, e.g. 250 = 2.5%)
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405, headers: cors });

  try {
    const { facility_id, tier_id, return_url } = await req.json();
    if (!facility_id || !tier_id) {
      return json({ error: 'Missing facility_id or tier_id' }, 400);
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Authenticated user (from JWT)
    const authHeader = req.headers.get('Authorization');
    const jwt = authHeader?.replace('Bearer ', '');
    if (!jwt) return json({ error: 'Not authenticated' }, 401);
    const { data: { user } } = await sb.auth.getUser(jwt);
    if (!user) return json({ error: 'Invalid token' }, 401);

    // Pull tier + facility metadata
    const { data: tier, error: tierErr } = await sb
      .from('facility_membership_tiers')
      .select('id, facility_id, name, price_cents, cadence, stripe_price_id')
      .eq('id', tier_id)
      .eq('facility_id', facility_id)
      .single();
    if (tierErr || !tier) return json({ error: 'Tier not found' }, 404);

    const { data: facility } = await sb.from('facilities').select('name, stripe_connect_account_id').eq('id', facility_id).single();
    if (!facility) return json({ error: 'Facility not found' }, 404);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const isSub = tier.cadence === 'monthly' || tier.cadence === 'annual';

    // If the facility has a stripe_price_id pre-configured, use that. Otherwise
    // build a one-off line_item from price_cents. This makes Stripe Connect
    // optional for v1; you can graduate to Connect when ready.
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = tier.stripe_price_id
      ? { price: tier.stripe_price_id, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency:    'usd',
            unit_amount: tier.price_cents,
            recurring:   isSub
              ? { interval: tier.cadence === 'annual' ? 'year' : 'month' }
              : undefined,
            product_data: {
              name:        `${facility.name} — ${tier.name}`,
              description: `Membership at ${facility.name}`,
            },
          },
        };

    // Apply platform fee if configured AND facility uses Connect
    const feeBps = parseInt(Deno.env.get('PADDLEGRID_PLATFORM_FEE_BPS') || '0', 10);
    const applicationFeeAmount = facility.stripe_connect_account_id && feeBps > 0
      ? Math.round((tier.price_cents * feeBps) / 10_000)
      : undefined;

    const session = await stripe.checkout.sessions.create({
      mode:               isSub ? 'subscription' : 'payment',
      line_items:         [lineItem],
      success_url:        `${return_url || 'https://paddlegrid.com'}?tier=${tier_id}&session={CHECKOUT_SESSION_ID}`,
      cancel_url:         `${return_url || 'https://paddlegrid.com'}?cancelled=1`,
      customer_email:     user.email,
      client_reference_id: user.id,
      metadata: {
        kind:        'facility_membership',
        facility_id,
        tier_id,
        user_id:     user.id,
      },
      ...(facility.stripe_connect_account_id && applicationFeeAmount
        ? {
            ...(isSub
              ? { subscription_data: { application_fee_percent: feeBps / 100 } }
              : { payment_intent_data: { application_fee_amount: applicationFeeAmount } }),
          }
        : {}),
    }, facility.stripe_connect_account_id
        ? { stripeAccount: facility.stripe_connect_account_id }
        : undefined
    );

    return json({ checkout_url: session.url });
  } catch (e: any) {
    return json({ error: e.message || 'Server error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
