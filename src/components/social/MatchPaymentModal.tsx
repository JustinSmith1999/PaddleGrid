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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white z-10 bg-black/20 rounded-full p-2 backdrop-blur-sm transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-8 py-12 text-white text-center">
          <div className="text-sm font-medium opacity-90 mb-2">
            {new Date(matchDetails.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="text-6xl font-black mb-3">{matchDetails.startTime}</div>
          <div className="text-emerald-50 text-base font-medium mb-4">
            {courtName}
          </div>
          {matchDetails.skillLevel && (
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full">
              <span className="text-sm font-semibold">{matchDetails.skillLevel} level</span>
              <span className="w-1 h-1 bg-white/60 rounded-full"></span>
              <span className="text-sm font-semibold">1 spot left</span>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-6xl font-black text-slate-900 mb-1">
              ${pricePerPerson.toFixed(2)}
            </div>
            <div className="text-slate-500 text-sm">Split between {matchDetails.maxPlayers || 4} players</div>
          </div>

          {paymentMethods.length === 0 ? (
            <button
              onClick={handleAddCard}
              disabled={addingCard}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition mb-4 flex items-center justify-center gap-2 text-slate-700 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Payment Method
            </button>
          ) : (
            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.stripe_payment_method_id)}
                  className={`w-full p-4 rounded-xl transition-all flex items-center justify-between ${
                    selectedPaymentMethod === method.stripe_payment_method_id
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold capitalize">
                        {method.card_brand} •••• {method.card_last4}
                      </div>
                    </div>
                  </div>
                  {selectedPaymentMethod === method.stripe_payment_method_id && (
                    <Check className="w-5 h-5" />
                  )}
                </button>
              ))}
              <button
                onClick={handleAddCard}
                disabled={addingCard}
                className="w-full py-3 text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
              >
                + Add Another Card
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 rounded-xl text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        <div className="px-6 pb-6">
          <button
            onClick={handlePayment}
            disabled={loading || !selectedPaymentMethod}
            className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-xl disabled:shadow-none mb-3"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              `Join & Pay $${pricePerPerson.toFixed(2)}`
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 text-slate-500 hover:text-slate-700 transition font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
