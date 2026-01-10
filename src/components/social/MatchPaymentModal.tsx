import { useState } from 'react';
import { X, Calendar, Clock, MapPin, CreditCard, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', user.id)
        .maybeSingle();

      const { data: authUser } = await supabase.auth.getUser();
      const userEmail = authUser?.user?.email || '';

      const userName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : 'Guest';

      const bookingPayload = {
        facility_id: facilityId,
        court_id: courtId,
        user_id: user.id,
        booking_date: matchDetails.date,
        start_time: matchDetails.startTime,
        end_time: matchDetails.endTime,
        duration_hours: durationHours,
        total_amount: pricePerPerson,
        user_email: userEmail,
        user_name: userName,
        user_phone: profile?.phone || '',
        court_name: courtName,
      };

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/courtreserve-booking`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to create booking');
      }

      await supabase
        .from('social_post_participants')
        .insert({
          post_id: postId,
          user_id: user.id
        });

      if (result.payment_url) {
        setPaymentUrl(result.payment_url);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
      setLoading(false);
    }
  }

  function handlePaymentRedirect() {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    }
  }

  if (paymentUrl) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Your booking has been created! Complete payment to confirm your spot in the match.
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Your share:</span>
                <span className="text-2xl font-bold text-emerald-600">
                  ${pricePerPerson.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handlePaymentRedirect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Complete Payment on CourtReserve
            </button>

            <p className="text-sm text-gray-500 mt-4 text-center">
              You will be redirected to CourtReserve's secure payment page
            </p>
          </div>
        </div>
      </div>
    );
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
