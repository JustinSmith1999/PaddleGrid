import { useState, useEffect } from 'react';
import { CreditCard, Loader } from 'lucide-react';
import { loadStripe } from '../lib/stripe';

interface StripePaymentProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripePayment({ clientSecret, amount, onSuccess, onError }: StripePaymentProps) {
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    const initStripe = async () => {
      try {
        const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

        if (!stripePublishableKey) {
          onError('Stripe is not configured. Please contact support.');
          return;
        }

        const stripeInstance = await loadStripe(stripePublishableKey);
        setStripe(stripeInstance);

        const elementsInstance = stripeInstance.elements({
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#2563eb',
              colorBackground: '#ffffff',
              colorText: '#1f2937',
              colorDanger: '#dc2626',
              fontFamily: 'system-ui, sans-serif',
              borderRadius: '8px',
            },
          },
        });

        const paymentElement = elementsInstance.create('payment');
        paymentElement.mount('#payment-element');

        paymentElement.on('ready', () => {
          setLoading(false);
        });

        paymentElement.on('change', (event: any) => {
          if (event.error) {
            setCardError(event.error.message);
          } else {
            setCardError(null);
          }
        });

        setElements(elementsInstance);
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        onError('Failed to initialize payment. Please try again.');
      }
    };

    initStripe();
  }, [clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setCardError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        setCardError(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setCardError('An unexpected error occurred');
      onError('An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-900">
          <CreditCard className="h-5 w-5" />
          <span className="font-semibold">
            Total: ${amount.toFixed(2)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div id="payment-element" className="min-h-[200px]">
          {loading && (
            <div className="flex items-center justify-center h-[200px]">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
        </div>

        {cardError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
            {cardError}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || loading || processing}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
        >
          {processing ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </button>
      </form>

      <div className="text-xs text-gray-500 text-center">
        Payments are securely processed by Stripe
      </div>
    </div>
  );
}
