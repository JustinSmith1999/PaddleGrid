import { useState } from 'react';
import { X, Calendar, Clock, MapPin, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface MatchPaymentModalProps {
  postId: string;
  bookingId: string;
  pricePerPerson: number;
  matchDetails: {
    sport: string;
    date: string;
    startTime: string;
    endTime: string;
    courtName: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function MatchPaymentModal({
  postId,
  bookingId,
  pricePerPerson,
  matchDetails,
  onClose,
  onSuccess
}: MatchPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayment() {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to join this match');
        setLoading(false);
        return;
      }

      const { data, error: sessionError } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          type: 'match_payment',
          postId,
          bookingId,
          amount: pricePerPerson,
          successUrl: `${window.location.origin}/feed?match_payment=success&post_id=${postId}`,
          cancelUrl: `${window.location.origin}/feed?match_payment=cancelled`
        }
      });

      if (sessionError) throw sessionError;

      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.sessionId) {
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Stripe failed to load');

        const { error: redirectError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        });

        if (redirectError) throw redirectError;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
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
            This match requires a court booking payment to join.
          </p>

          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg p-4 space-y-3">
            <div className="font-semibold text-gray-900">
              {matchDetails.sport.charAt(0).toUpperCase() + matchDetails.sport.slice(1)} Match
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {new Date(matchDetails.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{matchDetails.startTime} - {matchDetails.endTime}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{matchDetails.courtName}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Your share:</span>
                <span className="text-2xl font-bold text-emerald-600">
                  ${pricePerPerson.toFixed(2)}
                </span>
              </div>
            </div>
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
            disabled={loading}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {loading ? 'Processing...' : 'Pay & Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
