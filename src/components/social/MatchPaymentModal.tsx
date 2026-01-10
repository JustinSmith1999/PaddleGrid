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

  useEffect(() => {
    loadFacilityName();
    loadPaymentMethodsData();
    initializeStripe();
  }, []);

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
      const { clientSecret } = await createSetupIntent();

      const elementsInstance = stripe.elements({
        clientSecret,
        appearance: { theme: 'stripe' },
      });

      const paymentElement = elementsInstance.create('payment');
      paymentElement.mount('#payment-element');

      setElements(elementsInstance);
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
                setShowAddCard(false);
                setElements(null);
              }}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div id="payment-element" className="mb-4"></div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAddCard(false);
                setElements(null);
              }}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCard}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Card'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Join Match</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Review match details and select payment method:
          </p>

          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg p-5 space-y-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Match Type</div>
              <div className="font-bold text-gray-900 text-lg">
                {matchDetails.sport.charAt(0).toUpperCase() + matchDetails.sport.slice(1)} Match
              </div>
            </div>

            <div className="border-t border-blue-200 pt-3 space-y-3">
              {facilityName && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Venue</div>
                    <div className="font-semibold text-gray-900">{facilityName}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Court</div>
                  <div className="font-semibold text-gray-900">{courtName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Date</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(matchDetails.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Time</div>
                  <div className="font-semibold text-gray-900">
                    {matchDetails.startTime} - {matchDetails.endTime} ({durationHours}hr{durationHours !== 1 ? 's' : ''})
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-blue-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Your Share</div>
                  <div className="text-xs text-gray-500">Court booking fee split</div>
                </div>
                <span className="text-3xl font-bold text-emerald-600">
                  ${pricePerPerson.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <button
                onClick={handleAddCard}
                disabled={addingCard}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Card
              </button>
            </div>

            {paymentMethods.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No saved payment methods</p>
                <p className="text-xs mt-1">Add a card to continue</p>
              </div>
            ) : (
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.stripe_payment_method_id)}
                    className={`w-full p-4 rounded-lg border-2 transition flex items-center justify-between ${
                      selectedPaymentMethod === method.stripe_payment_method_id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 capitalize">
                          {method.card_brand} •••• {method.card_last4}
                        </div>
                        <div className="text-xs text-gray-500">
                          Expires {method.exp_month}/{method.exp_year}
                        </div>
                      </div>
                    </div>
                    {selectedPaymentMethod === method.stripe_payment_method_id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading || !selectedPaymentMethod}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {loading ? 'Processing...' : `Pay $${pricePerPerson.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
