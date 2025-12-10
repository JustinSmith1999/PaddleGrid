import { useState, useEffect } from 'react';
import { loadStripe, createSeriesPaymentIntent } from '../lib/stripe';
import { CreditCard, Lock } from 'lucide-react';

interface StripeSeriesPaymentProps {
  seriesId: string;
  occurrenceIds: string[];
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export default function StripeSeriesPayment({
  seriesId,
  occurrenceIds,
  amount,
  onSuccess,
  onCancel
}: StripeSeriesPaymentProps) {
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');

  useEffect(() => {
    initializePayment();
  }, []);

  async function initializePayment() {
    try {
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('Stripe publishable key not configured');
      }

      const stripeInstance = await loadStripe(publishableKey);
      setStripe(stripeInstance);

      const { clientSecret: secret } = await createSeriesPaymentIntent(
        seriesId,
        occurrenceIds,
        amount
      );
      setClientSecret(secret);

      const appearance = {
        theme: 'stripe' as const,
        variables: {
          colorPrimary: '#059669',
          borderRadius: '8px',
        },
      };

      const elementsInstance = stripeInstance.elements({
        clientSecret: secret,
        appearance,
      });

      const paymentElement = elementsInstance.create('payment');
      paymentElement.mount('#payment-element');

      setElements(elementsInstance);
      setLoading(false);
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setError(err.message || 'Failed to initialize payment');
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else {
        setError('Payment processing. Please wait...');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
          {error}
        </div>
        <button
          onClick={onCancel}
          className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="w-4 h-4" />
            <span>Secure Payment</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Total Amount</span>
          </div>
          <div className="text-3xl font-bold text-blue-900">
            ${amount.toFixed(2)}
          </div>
          <p className="text-sm text-blue-700 mt-1">
            for {occurrenceIds.length} {occurrenceIds.length === 1 ? 'session' : 'sessions'}
          </p>
        </div>

        <div id="payment-element" className="p-4 border border-gray-200 rounded-lg bg-white" />

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={processing || !stripe}
          className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Your payment information is encrypted and secure. Powered by Stripe.
      </div>
    </form>
  );
}
