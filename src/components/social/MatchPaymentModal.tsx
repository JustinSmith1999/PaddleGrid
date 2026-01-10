import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, CreditCard, Building2, Plus, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getPaymentMethods, createMatchPaymentIntent, loadStripe, createSetupIntent, savePaymentMethod } from '../../lib/stripe';

interface MatchPaymentModalProps {
  postId: string;
  courtId: string;
  facilityId: string;
  courtName: string;
  pricePerPerson: number;
  totalAmount: number;
  durationHours: number;
  matchDetails: {
    sport: string;
    date: string;
    startTime: string;
    endTime: string;
    courtName: string;
    facilityName?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export default function MatchPaymentModal({
  postId,
  courtId,
  facilityId,
  courtName,
  pricePerPerson,
  totalAmount,
  durationHours,
  matchDetails,
  onClose,
  onSuccess
}: MatchPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facilityName, setFacilityName] = useState<string>(matchDetails.facilityName || '');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    loadFacilityName();
    loadPaymentMethodsData();
    initializeStripe();
  }, []);

  useEffect(() => {
    let mounted = true;

    if (showAddCard && stripe && clientSecret && !elements) {
      const mountElement = () => {
        if (!mounted) return;

        try {
          const paymentElementContainer = document.querySelector('#payment-element');
          if (!paymentElementContainer) {
            console.error('Payment element container not found');
            setTimeout(mountElement, 50);
            return;
          }

          const elementsInstance = stripe.elements({
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#10b981',
              }
            },
          });

          const paymentElement = elementsInstance.create('payment', {
            layout: 'tabs'
          });

          paymentElement.on('ready', () => {
            console.log('Payment element is ready');
          });

          paymentElement.mount('#payment-element');

          if (mounted) {
            setElements(elementsInstance);
          }
        } catch (err) {
          console.error('Failed to mount payment element:', err);
          if (mounted) {
            setError('Failed to load payment form. Please try again.');
          }
        }
      };

      setTimeout(mountElement, 150);
    }

    return () => {
      mounted = false;
    };
  }, [showAddCard, stripe, clientSecret]);

  async function loadFacilityName() {
    if (!facilityName && facilityId) {
      const { data } = await supabase
        .from('facilities')
        .select('name')
        .eq('id', facilityId)
        .maybeSingle();

      if (data) {
        setFacilityName(data.name);
      }
    }
  }

  async function loadPaymentMethodsData() {
    try {
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
      const defaultMethod = methods.find(m => m.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.stripe_payment_method_id);
      }
    } catch (err) {
      console.error('Failed to load payment methods:', err);
    }
  }

  async function initializeStripe() {
    try {
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        console.error('Stripe publishable key not configured');
        return;
      }
      const stripeInstance = await loadStripe(publishableKey);
      setStripe(stripeInstance);
    } catch (err) {
      console.error('Failed to initialize Stripe:', err);
    }
  }

  async function handleAddCard() {
    if (!stripe) {
      setError('Stripe not initialized');
      return;
    }

    setAddingCard(true);
    setError(null);

    try {
      const { clientSecret: secret } = await createSetupIntent();
      setClientSecret(secret);
      setShowAddCard(true);
    } catch (err: any) {
      console.error('Failed to add card:', err);
      setError(err.message || 'Failed to add card');
    } finally {
      setAddingCard(false);
    }
  }

  async function handleSaveCard() {
    if (!stripe || !elements) {
      setError('Stripe not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });

      if (submitError) {
        throw new Error(submitError.message);
      }

      if (setupIntent.status === 'succeeded') {
        await savePaymentMethod(setupIntent.payment_method);
        await loadPaymentMethodsData();
        setShowAddCard(false);
        setElements(null);
        setClientSecret(null);
      }
    } catch (err: any) {
      console.error('Failed to save card:', err);
      setError(err.message || 'Failed to save card');
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to join this match');
        setLoading(false);
        return;
      }

      const result = await createMatchPaymentIntent(
        postId,
        courtId,
        facilityId,
        pricePerPerson,
        selectedPaymentMethod
      );

      if (result.success && result.status === 'succeeded') {
        await supabase
          .from('social_post_participants')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        onSuccess();
      } else {
        throw new Error('Payment failed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
      setLoading(false);
    }
  }

  if (showAddCard) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Add Payment Method</h2>
            <button
              onClick={() => {
                if (elements) {
                  try {
                    const paymentElement = elements.getElement('payment');
                    if (paymentElement) {
                      paymentElement.unmount();
                    }
                  } catch (err) {
                    console.error('Error unmounting payment element:', err);
                  }
                }
                setShowAddCard(false);
                setElements(null);
                setClientSecret(null);
                setError(null);
              }}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!elements && (
            <div className="mb-4 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading payment form...</p>
            </div>
          )}

          <div id="payment-element" className={`mb-4 ${!elements ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}></div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (elements) {
                  try {
                    const paymentElement = elements.getElement('payment');
                    if (paymentElement) {
                      paymentElement.unmount();
                    }
                  } catch (err) {
                    console.error('Error unmounting payment element:', err);
                  }
                }
                setShowAddCard(false);
                setElements(null);
                setClientSecret(null);
                setError(null);
              }}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCard}
              disabled={loading || !elements}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Card'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {new Date(matchDetails.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {matchDetails.startTime}
            </h3>
            <p className="text-slate-600 mt-1">{courtName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center py-4">
            <div className="text-5xl font-black text-slate-900">${pricePerPerson.toFixed(2)}</div>
          </div>

          {paymentMethods.length === 0 ? (
            <button
              onClick={handleAddCard}
              disabled={addingCard}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 font-medium"
            >
              Add Payment Method
            </button>
          ) : (
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.stripe_payment_method_id)}
                  className={`w-full p-3 rounded-lg flex items-center justify-between transition ${
                    selectedPaymentMethod === method.stripe_payment_method_id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <span className="font-medium">{method.card_brand} •••• {method.card_last4}</span>
                  {selectedPaymentMethod === method.stripe_payment_method_id && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading || !selectedPaymentMethod}
            className="w-full py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-bold text-lg"
          >
            {loading ? 'Processing...' : `Pay $${pricePerPerson.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
