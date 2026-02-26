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

    if (path === '/setup-intent' && req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        throw new Error('Unauthorized');
      }

      let { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email')
        .eq('id', user.id)
        .single();

      let customerId = profile?.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: profile?.email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;

        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card', 'us_bank_account'],
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });

      return new Response(
        JSON.stringify({
          clientSecret: setupIntent.client_secret,
          customerId,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (path === '/payment-methods' && req.method === 'GET') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        throw new Error('Unauthorized');
      }

      const { data: methods } = await supabase
        .from('stripe_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      return new Response(
        JSON.stringify({ paymentMethods: methods || [] }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (path === '/save-payment-method' && req.method === 'POST') {
      const { paymentMethodId } = await req.json();

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
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new Error('No Stripe customer found');
      }

      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      const { data: existingMethods } = await supabase
        .from('stripe_payment_methods')
        .select('id')
        .eq('user_id', user.id);

      const isFirstCard = !existingMethods || existingMethods.length === 0;

      await supabase
        .from('stripe_payment_methods')
        .insert({
          user_id: user.id,
          stripe_customer_id: profile.stripe_customer_id,
          stripe_payment_method_id: paymentMethodId,
          card_brand: paymentMethod.card?.brand || 'unknown',
          card_last4: paymentMethod.card?.last4 || '0000',
          exp_month: paymentMethod.card?.exp_month || 0,
          exp_year: paymentMethod.card?.exp_year || 0,
          is_default: isFirstCard,
        });

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (path === '/match-payment-intent' && req.method === 'POST') {
      const { postId, courtId, facilityId, amount, paymentMethodId } = await req.json();

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
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new Error('No Stripe customer found');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        customer: profile.stripe_customer_id,
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        return_url: `${req.headers.get('origin')}/feed`,
        metadata: {
          postId,
          courtId,
          facilityId,
          userId: user.id,
          type: 'match_payment',
        },
      });

      await supabase
        .from('match_participant_payments')
        .insert({
          post_id: postId,
          user_id: user.id,
          amount_paid: amount,
          payment_intent_id: paymentIntent.id,
          payment_status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
        });

      return new Response(
        JSON.stringify({
          success: true,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (path === '/booking-extension-payment' && req.method === 'POST') {
      const { bookingId, amount, paymentMethodId } = await req.json();

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
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new Error('No Stripe customer found');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        customer: profile.stripe_customer_id,
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        return_url: `${req.headers.get('origin')}/bookings`,
        metadata: {
          bookingId,
          userId: user.id,
          type: 'booking_extension',
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (path === '/merch-payment' && req.method === 'POST') {
      const { productId, quantity, amount, paymentMethodId } = await req.json();

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
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new Error('No Stripe customer found');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        customer: profile.stripe_customer_id,
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        return_url: `${req.headers.get('origin')}/merch`,
        metadata: {
          productId,
          quantity,
          userId: user.id,
          type: 'merch_purchase',
        },
      });

      await supabase
        .from('merch_orders')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity,
          total_amount: amount,
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
        });

      return new Response(
        JSON.stringify({
          success: true,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (path === '/set-default-payment-method' && req.method === 'POST') {
      const { paymentMethodId } = await req.json();

      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        throw new Error('Unauthorized');
      }

      await supabase
        .from('stripe_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      await supabase
        .from('stripe_payment_methods')
        .update({ is_default: true })
        .eq('stripe_payment_method_id', paymentMethodId)
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (path === '/delete-payment-method' && req.method === 'DELETE') {
      const { paymentMethodId } = await req.json();

      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        throw new Error('Unauthorized');
      }

      await stripe.paymentMethods.detach(paymentMethodId);

      await supabase
        .from('stripe_payment_methods')
        .delete()
        .eq('stripe_payment_method_id', paymentMethodId)
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ success: true }),
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