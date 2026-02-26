import { useState, useEffect } from 'react';
import { Clock, AlertCircle, X, CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createBookingExtensionPayment, getPaymentMethods } from '../lib/stripe';
import SavedPaymentMethods from './SavedPaymentMethods';

interface BookingExtensionProps {
  bookingId?: string;
  onClose: () => void;
}

interface BookingDetails {
  id: string;
  court_id: string;
  court_name: string;
  end_time: string;
  user_id: string;
  can_extend: boolean;
  alternative_court_id?: string;
  alternative_court_name?: string;
}

export default function BookingExtensionNotification({ bookingId, onClose }: BookingExtensionProps) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState(false);
  const [extensionResult, setExtensionResult] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number>(25);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  useEffect(() => {
    if (!booking) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const endTime = new Date(booking.end_time);
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          court_id,
          end_time,
          user_id,
          courts (
            name,
            facility_id
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      const { data: canExtend } = await supabase
        .rpc('can_extend_booking', {
          p_court_id: bookingData.court_id,
          p_end_time: bookingData.end_time,
          p_duration_hours: 1
        });

      let alternativeCourt = null;
      if (!canExtend) {
        const { data: alternatives } = await supabase
          .rpc('find_nearest_available_court', {
            p_facility_id: bookingData.courts.facility_id,
            p_start_time: bookingData.end_time,
            p_duration_hours: 1,
            p_exclude_court_id: bookingData.court_id
          });

        if (alternatives && alternatives.length > 0) {
          alternativeCourt = alternatives[0];
        }
      }

      setBooking({
        id: bookingData.id,
        court_id: bookingData.court_id,
        court_name: bookingData.courts.name,
        end_time: bookingData.end_time,
        user_id: bookingData.user_id,
        can_extend: canExtend || false,
        alternative_court_id: alternativeCourt?.court_id,
        alternative_court_name: alternativeCourt?.court_name
      });
    } catch (error) {
      console.error('Error loading booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async (acceptAlternative: boolean = true) => {
    if (!booking) return;

    if (!selectedPaymentMethod) {
      setShowPaymentSelector(true);
      return;
    }

    try {
      setExtending(true);

      const paymentResult = await createBookingExtensionPayment(
        booking.id,
        estimatedCost,
        selectedPaymentMethod
      );

      if (paymentResult.success && paymentResult.status === 'succeeded') {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error('Not authenticated');
        }

        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extend-booking`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking_id: booking.id,
            duration_hours: 1,
            accept_alternative: acceptAlternative,
            payment_intent_id: paymentResult.paymentIntentId
          })
        });

        const result = await response.json();
        setExtensionResult(result);

        if (result.success) {
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 3000);
        }
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Error extending booking:', error);
      setExtensionResult({
        success: false,
        error: 'Failed to extend booking'
      });
    } finally {
      setExtending(false);
    }
  };

  useEffect(() => {
    const loadDefaultPaymentMethod = async () => {
      try {
        const methods = await getPaymentMethods();
        const defaultMethod = methods.find(m => m.is_default);
        if (defaultMethod) {
          setSelectedPaymentMethod(defaultMethod.stripe_payment_method_id);
        }
      } catch (err) {
        console.error('Failed to load payment methods:', err);
      }
    };
    loadDefaultPaymentMethod();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  if (extensionResult) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
          {extensionResult.success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Extended!</h3>

              {extensionResult.extension_type === 'same_court' ? (
                <p className="text-gray-600 mb-4">
                  Your booking at <span className="font-semibold">{extensionResult.court_name}</span> has been extended for 1 hour.
                </p>
              ) : (
                <div className="mb-4">
                  <p className="text-gray-600 mb-2">
                    Your original court was unavailable, so we've booked you on:
                  </p>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                    <p className="font-semibold text-blue-900">{extensionResult.court_name}</p>
                    <p className="text-sm text-blue-700">for the next hour</p>
                  </div>
                </div>
              )}

              <p className="text-lg font-bold text-gray-900">
                Total: ${extensionResult.cost.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Payment pending</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Extension Failed</h3>
              <p className="text-gray-600 mb-4">
                {extensionResult.message || 'Unable to extend your booking at this time.'}
              </p>
              <button
                onClick={onClose}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 border-orange-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Time Running Out</h3>
              <p className="text-sm text-gray-600">Your court booking ends soon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white border-2 border-orange-200 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 font-medium">Court:</span>
            <span className="font-bold text-gray-900">{booking.court_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Time Remaining:</span>
            <span className="font-bold text-orange-600 text-lg">{timeRemaining}</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {booking.can_extend ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Your court is available</p>
                  <p className="text-sm text-green-700">Extend for another hour on the same court</p>
                </div>
              </div>
            </div>
          ) : booking.alternative_court_name ? (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Your court is booked</p>
                  <p className="text-sm text-blue-700 mb-2">
                    But <span className="font-semibold">{booking.alternative_court_name}</span> is available
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">No courts available</p>
                  <p className="text-sm text-red-700">All courts are currently booked</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {showPaymentSelector ? (
          <div className="mb-6">
            <SavedPaymentMethods
              onSelectMethod={(methodId) => {
                setSelectedPaymentMethod(methodId);
                setShowPaymentSelector(false);
              }}
            />
          </div>
        ) : (
          <div className="bg-white border-2 border-stone-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-stone-600" />
              <span className="text-sm text-stone-700">Payment Method</span>
            </div>
            <button
              onClick={() => setShowPaymentSelector(true)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {selectedPaymentMethod ? 'Change' : 'Select'}
            </button>
          </div>
        )}

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Extension Cost:</span>
            <span className="text-lg font-bold text-stone-900">${estimatedCost.toFixed(2)}</span>
          </div>
        </div>

        {(booking.can_extend || booking.alternative_court_name) && (
          <button
            onClick={() => handleExtend(true)}
            disabled={extending || !selectedPaymentMethod}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-xl font-bold hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {extending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing Payment...
              </>
            ) : !selectedPaymentMethod ? (
              'Select Payment Method'
            ) : (
              'Extend for 1 Hour'
            )}
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 bg-gray-100 text-gray-700 py-2 px-4 rounded-xl font-semibold hover:bg-gray-200 transition"
        >
          Not Now
        </button>
      </div>
    </div>
  );
}
