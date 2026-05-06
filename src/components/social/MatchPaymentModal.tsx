import { useState, useEffect } from 'react';
import { X, CreditCard, Plus, Check, Shield, Zap, Smartphone, ToggleLeft, ToggleRight, ChevronRight, Building2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { loadStripe, createSetupIntent, savePaymentMethod } from '../../lib/stripe';
import {
  getFacilityPaymentConfig,
  getUnifiedPaymentMethods,
  processMatchPayment,
  toggleAutoBilling,
  getProcessorDisplayName,
  type FacilityPaymentConfig,
  type UnifiedPaymentMethod,
} from '../../lib/paymentProcessor';

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
  const [paymentMethods, setPaymentMethods] = useState<UnifiedPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [facilityPaymentConfig, setFacilityPaymentConfig] = useState<FacilityPaymentConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    loadFacilityData();
    loadPaymentMethodsData();
  }, []);

  useEffect(() => {
    let mounted = true;

    if (showAddCard && stripe && clientSecret && !elements) {
      const mountElement = () => {
        if (!mounted) return;

        try {
          const paymentElementContainer = document.querySelector('#payment-element');
          if (!paymentElementContainer) {
            setTimeout(mountElement, 50);
            return;
          }

          const elementsInstance = stripe.elements({
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#15803d',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '16px',
                borderRadius: '12px',
              }
            },
          });

          const paymentElement = elementsInstance.create('payment', {
            layout: 'tabs',
            defaultValues: {
              billingDetails: { name: '', email: '' }
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto'
            }
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

    return () => { mounted = false; };
  }, [showAddCard, stripe, clientSecret]);

  async function loadFacilityData() {
    try {
      // Load facility payment config
      const config = await getFacilityPaymentConfig(facilityId);
      setFacilityPaymentConfig(config);

      // Initialize Stripe if needed
      if (config.processor === 'stripe') {
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (publishableKey) {
          const stripeInstance = await loadStripe(publishableKey);
          setStripe(stripeInstance);
        }
      }

      // Load facility name if not provided
      if (!facilityName && facilityId) {
        const { data } = await supabase
          .from('facilities')
          .select('name')
          .eq('id', facilityId)
          .maybeSingle();

        if (data) setFacilityName(data.name);
      }
    } catch (err) {
      console.error('Failed to load facility payment config:', err);
      // Fall back to Stripe
      setFacilityPaymentConfig({
        processor: 'stripe',
        processorInfo: null,
        paymentConfig: {},
      });

      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (publishableKey) {
        const stripeInstance = await loadStripe(publishableKey);
        setStripe(stripeInstance);
      }
    } finally {
      setLoadingConfig(false);
    }
  }

  async function loadPaymentMethodsData() {
    try {
      const processor = facilityPaymentConfig?.processor || 'stripe';
      const methods = await getUnifiedPaymentMethods(processor);
      setPaymentMethods(methods);
      const defaultMethod = methods.find(m => m.isDefault);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.processorPaymentMethodId);
      }
    } catch (err) {
      console.error('Failed to load payment methods:', err);
    }
  }

  // Reload payment methods when config loads
  useEffect(() => {
    if (facilityPaymentConfig) {
      loadPaymentMethodsData();
    }
  }, [facilityPaymentConfig]);

  async function handleAddCard() {
    if (facilityPaymentConfig?.processor !== 'stripe') {
      setError('Adding cards is only supported for Stripe-enabled facilities.');
      return;
    }
    if (!stripe) {
      setError('Payment system not available. Please refresh and try again.');
      return;
    }

    setAddingCard(true);
    setError(null);

    try {
      const { clientSecret: secret } = await createSetupIntent();
      setClientSecret(secret);
      setShowAddCard(true);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment form.');
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

      if (submitError) throw new Error(submitError.message);

      if (setupIntent.status === 'succeeded') {
        await savePaymentMethod(setupIntent.payment_method);
        await loadPaymentMethodsData();
        setShowAddCard(false);
        setElements(null);
        setClientSecret(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save card');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleAutoBilling(method: UnifiedPaymentMethod) {
    try {
      await toggleAutoBilling(method.id, !method.autoBillingEnabled);
      await loadPaymentMethodsData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handlePayment() {
    const processor = facilityPaymentConfig?.processor || 'stripe';

    if (processor === 'none') {
      // No payment required — just join
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('You must be logged in'); setLoading(false); return; }

        await supabase.from('social_post_participants').insert({ post_id: postId, user_id: user.id });
        onSuccess();
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
      return;
    }

    if (!selectedPaymentMethod && processor !== 'safesave') {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('You must be logged in'); setLoading(false); return; }

      const result = await processMatchPayment(
        processor,
        postId,
        courtId,
        facilityId,
        pricePerPerson,
        selectedPaymentMethod || ''
      );

      if (result.success) {
        await supabase.from('social_post_participants').insert({ post_id: postId, user_id: user.id });
        onSuccess();
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process payment.');
      setLoading(false);
    }
  }

  const processor = facilityPaymentConfig?.processor || 'stripe';
  const processorInfo = facilityPaymentConfig?.processorInfo;
  const supportsApplePay = processorInfo?.supports_apple_pay ?? (processor === 'stripe');
  const supportsGooglePay = processorInfo?.supports_google_pay ?? (processor === 'stripe');

  // ─── Add Card View ───────────────────────────────────────
  if (showAddCard) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-br from-green-700 to-green-800 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Add Payment Method</h2>
                <p className="text-green-200 text-sm mt-0.5">Secure card entry powered by Stripe</p>
              </div>
              <button
                onClick={() => {
                  if (elements) {
                    try { elements.getElement('payment')?.unmount(); } catch (_) {}
                  }
                  setShowAddCard(false);
                  setElements(null);
                  setClientSecret(null);
                  setError(null);
                }}
                className="text-white/70 hover:text-white transition p-1"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {!elements && (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-green-700 border-t-transparent mx-auto"></div>
                <p className="text-sm text-slate-600 mt-3 font-medium">Loading secure payment form...</p>
              </div>
            )}

            <div
              id="payment-element"
              className={`transition-all duration-300 ${!elements ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 min-h-[200px]'}`}
            ></div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (elements) {
                    try { elements.getElement('payment')?.unmount(); } catch (_) {}
                  }
                  setShowAddCard(false);
                  setElements(null);
                  setClientSecret(null);
                  setError(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCard}
                disabled={loading || !elements}
                className="flex-1 px-4 py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? 'Saving...' : 'Save Card'}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Secured with 256-bit encryption</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main Payment View ───────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-green-700 to-green-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Join & Pay</h3>
              {facilityName && (
                <p className="text-green-200 text-sm mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {facilityName}
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Match Details Card */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {new Date(matchDetails.date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric'
                })}
              </span>
              <span className="text-sm text-slate-500">
                {matchDetails.startTime} – {matchDetails.endTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{courtName}</span>
              <span className="text-sm text-slate-500">{durationHours}h</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-center py-2">
            <div className="text-4xl font-black text-slate-900">${pricePerPerson.toFixed(2)}</div>
            <p className="text-sm text-slate-400 mt-1">per person</p>
          </div>

          {loadingConfig ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-green-700 border-t-transparent mx-auto"></div>
              <p className="text-sm text-slate-500 mt-3">Loading payment options...</p>
            </div>
          ) : processor === 'none' ? (
            /* No payment processor — pay at facility */
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
              <Building2 className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-amber-800">Pay at Facility</p>
              <p className="text-xs text-amber-600 mt-1">This facility handles payments in person</p>
            </div>
          ) : processor === 'safesave' ? (
            /* SafeSave payment flow */
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">SafeSave Payment</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Powered by {facilityName}'s payment processor
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center">
                You'll be redirected to SafeSave's secure payment page
              </p>
            </div>
          ) : (
            /* Stripe payment flow */
            <div className="space-y-3">
              {/* Apple Pay / Google Pay buttons */}
              {(supportsApplePay || supportsGooglePay) && (
                <div className="space-y-2">
                  {supportsApplePay && (
                    <button
                      onClick={() => {
                        // Apple Pay triggers through Stripe's Payment Request Button
                        // For now, show the add card flow which includes wallet options
                        handleAddCard();
                      }}
                      className="w-full py-3.5 bg-black hover:bg-gray-900 text-white rounded-xl transition font-semibold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.72 7.56c-.17.12-1.88 1.08-1.88 3.31 0 2.58 2.27 3.49 2.33 3.51-.01.06-.36 1.24-1.2 2.45-.74 1.08-1.52 2.15-2.72 2.15s-1.49-.7-2.87-.7c-1.34 0-1.82.72-2.9.72s-1.86-1-2.72-2.21C4.6 15.18 3.75 12.85 3.75 10.66c0-3.52 2.29-5.39 4.54-5.39 1.2 0 2.19.79 2.94.79.71 0 1.83-.84 3.19-.84.52 0 2.37.05 3.3 1.34zM14.15 3.88c.55-.65.94-1.56.94-2.47 0-.13-.01-.25-.04-.35-.89.03-1.95.6-2.59 1.33-.5.56-.97 1.47-.97 2.39 0 .14.02.28.04.32.06.01.17.03.27.03.81 0 1.8-.54 2.35-1.25z"/>
                      </svg>
                      Pay
                    </button>
                  )}
                  {supportsGooglePay && (
                    <button
                      onClick={() => handleAddCard()}
                      className="w-full py-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl transition font-semibold flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Pay
                    </button>
                  )}

                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 border-t border-slate-200"></div>
                    <span className="text-xs text-slate-400 font-medium">or pay with card</span>
                    <div className="flex-1 border-t border-slate-200"></div>
                  </div>
                </div>
              )}

              {/* Saved Cards */}
              {paymentMethods.length === 0 ? (
                <button
                  onClick={handleAddCard}
                  disabled={addingCard}
                  className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 text-slate-600 rounded-xl transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addingCard ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add a Card
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const isSelected = selectedPaymentMethod === method.processorPaymentMethodId;
                    return (
                      <motion.button
                        key={method.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPaymentMethod(method.processorPaymentMethodId)}
                        className={`w-full p-3.5 rounded-xl flex items-center justify-between transition-all duration-200 ${
                          isSelected
                            ? 'bg-green-50 border-2 border-green-600 shadow-sm'
                            : 'bg-slate-50 border-2 border-transparent hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-green-100' : 'bg-slate-100'
                          }`}>
                            <CreditCard className={`w-5 h-5 ${isSelected ? 'text-green-700' : 'text-slate-500'}`} />
                          </div>
                          <div className="text-left">
                            <span className={`text-sm font-semibold ${isSelected ? 'text-green-800' : 'text-slate-800'}`}>
                              {method.brand} •••• {method.last4}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400">
                                Exp {method.expMonth}/{method.expYear}
                              </span>
                              {method.isDefault && (
                                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Auto-billing toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAutoBilling(method);
                            }}
                            className={`p-1 rounded-lg transition ${
                              method.autoBillingEnabled
                                ? 'text-green-600'
                                : 'text-slate-300 hover:text-slate-400'
                            }`}
                            title={method.autoBillingEnabled ? 'Auto-billing on' : 'Auto-billing off'}
                          >
                            {method.autoBillingEnabled ? (
                              <ToggleRight className="w-6 h-6" />
                            ) : (
                              <ToggleLeft className="w-6 h-6" />
                            )}
                          </button>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}

                  <button
                    onClick={handleAddCard}
                    disabled={addingCard}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-slate-500 font-medium flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                  >
                    {addingCard ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Add Another Card
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Pay Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            disabled={loading || (!selectedPaymentMethod && processor === 'stripe' && paymentMethods.length > 0)}
            className="w-full py-4 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : processor === 'none' ? (
              'Join Match'
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Pay ${pricePerPerson.toFixed(2)}
              </>
            )}
          </motion.button>

          {/* Footer info */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Secure payment</span>
            </div>
            {processor !== 'none' && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>via {getProcessorDisplayName(processor)}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
