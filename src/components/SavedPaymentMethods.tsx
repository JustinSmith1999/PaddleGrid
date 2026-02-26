import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Check, X, Apple, Smartphone } from 'lucide-react';
import { loadStripe, createSetupIntent, getPaymentMethods, savePaymentMethod, setDefaultPaymentMethod, deletePaymentMethod } from '../lib/stripe';

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface SavedPaymentMethodsProps {
  onSelectMethod?: (methodId: string) => void;
  showAddCard?: boolean;
}

export default function SavedPaymentMethods({ onSelectMethod, showAddCard = true }: SavedPaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
      const defaultMethod = methods.find(m => m.is_default);
      if (defaultMethod) {
        setSelectedMethod(defaultMethod.stripe_payment_method_id);
      }
    } catch (err) {
      console.error('Failed to load payment methods:', err);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    try {
      setProcessing(true);
      setError(null);

      const { clientSecret } = await createSetupIntent();
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: (window as any).cardElement,
          billing_details: {},
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (setupIntent?.payment_method) {
        await savePaymentMethod(setupIntent.payment_method as string);
        setSuccess('Payment method added successfully');
        setShowAddForm(false);
        await loadPaymentMethods();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      setProcessing(true);
      await setDefaultPaymentMethod(methodId);
      setSuccess('Default payment method updated');
      await loadPaymentMethods();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      setProcessing(true);
      await deletePaymentMethod(methodId);
      setSuccess('Payment method removed');
      await loadPaymentMethods();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectMethod = (methodId: string) => {
    setSelectedMethod(methodId);
    if (onSelectMethod) {
      onSelectMethod(methodId);
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return <CreditCard className="w-6 h-6 text-blue-600" />;
      case 'mastercard':
        return <CreditCard className="w-6 h-6 text-red-600" />;
      case 'amex':
        return <CreditCard className="w-6 h-6 text-blue-800" />;
      case 'discover':
        return <CreditCard className="w-6 h-6 text-orange-600" />;
      default:
        return <CreditCard className="w-6 h-6 text-stone-600" />;
    }
  };

  useEffect(() => {
    if (showAddForm) {
      const loadStripeElements = async () => {
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        const elements = stripe.elements();
        const cardElement = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#1c1917',
              '::placeholder': {
                color: '#78716c',
              },
            },
          },
        });
        cardElement.mount('#card-element');
        (window as any).cardElement = cardElement;
      };
      loadStripeElements();
    }
  }, [showAddForm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800">{success}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-stone-800">Payment Methods</h3>
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <Apple className="w-5 h-5" />
          <span>Apple Pay</span>
          <Smartphone className="w-5 h-5 ml-2" />
          <span>Google Pay</span>
        </div>
      </div>

      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            onClick={() => handleSelectMethod(method.stripe_payment_method_id)}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              selectedMethod === method.stripe_payment_method_id
                ? 'border-emerald-600 bg-emerald-50'
                : 'border-stone-200 bg-white hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getCardIcon(method.card_brand)}
                <div>
                  <div className="font-medium text-stone-800 capitalize">
                    {method.card_brand} •••• {method.card_last4}
                  </div>
                  <div className="text-sm text-stone-600">
                    Expires {method.exp_month}/{method.exp_year}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {method.is_default && (
                  <span className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded">
                    Default
                  </span>
                )}
                {!method.is_default && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(method.stripe_payment_method_id);
                    }}
                    disabled={processing}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(method.stripe_payment_method_id);
                  }}
                  disabled={processing}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddCard && (
        <>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full p-4 border-2 border-dashed border-stone-300 rounded-xl text-stone-600 hover:border-emerald-600 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Payment Method
            </button>
          ) : (
            <div className="p-6 border-2 border-stone-200 rounded-xl bg-white space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-stone-800">Add Payment Method</h4>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">
                  Card Details
                </label>
                <div id="card-element" className="p-3 border border-stone-300 rounded-lg bg-white"></div>
                <p className="text-xs text-stone-600">
                  Supports credit cards, debit cards, Apple Pay, and Google Pay
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddCard}
                  disabled={processing}
                  className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {processing ? 'Adding...' : 'Add Payment Method'}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  disabled={processing}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
