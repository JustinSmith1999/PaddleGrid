import { supabase } from './supabase';

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export async function createPaymentIntent(
  bookingId: string,
  amount: number,
  metadata: Record<string, any> = {}
): Promise<PaymentIntentResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payments/create-payment-intent`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId,
        amount,
        currency: 'usd',
        metadata,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment intent');
  }

  return response.json();
}

export async function processRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<{ success: boolean; refundId: string; status: string }> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payments/refund`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        amount,
        reason,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process refund');
  }

  return response.json();
}

export async function createSeriesPaymentIntent(
  seriesId: string,
  occurrenceIds: string[],
  amount: number,
  metadata: Record<string, any> = {}
): Promise<PaymentIntentResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payments/create-series-payment-intent`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seriesId,
        occurrenceIds,
        amount,
        currency: 'usd',
        metadata,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment intent');
  }

  return response.json();
}

export function loadStripe(publishableKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).Stripe) {
      resolve((window as any).Stripe(publishableKey));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      if ((window as any).Stripe) {
        resolve((window as any).Stripe(publishableKey));
      } else {
        reject(new Error('Stripe failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Stripe'));
    document.body.appendChild(script);
  });
}

export async function createFacilityCheckoutSession(
  priceId: string,
  metadata: Record<string, any> = {}
): Promise<{ sessionId: string; url: string }> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: priceId,
        mode: 'subscription',
        success_url: `${window.location.origin}/facility-signup-complete`,
        cancel_url: `${window.location.origin}/?signup=facility`,
        metadata,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
}
