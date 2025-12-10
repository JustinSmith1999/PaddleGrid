import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { registerForOccurrence, calculateSeriesPrice } from '../lib/seriesUtils';
import { CheckCircle, Calendar, DollarSign, Download, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import StripeSeriesPayment from './StripeSeriesPayment';

interface SeriesRegistrationProps {
  seriesId: string;
  seriesTitle: string;
  occurrenceIds: string[];
  occurrences: any[];
  pricePerSession: number;
  discountPercentage: number;
  onComplete: () => void;
  onCancel: () => void;
}

export default function SeriesRegistration({
  seriesId,
  seriesTitle,
  occurrenceIds,
  occurrences,
  pricePerSession,
  discountPercentage,
  onComplete,
  onCancel
}: SeriesRegistrationProps) {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const totalPrice = calculateSeriesPrice(pricePerSession, occurrenceIds.length, discountPercentage);

  async function handleProceedToPayment() {
    if (!user) {
      setError('You must be signed in to register');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const results = await Promise.all(
        occurrenceIds.map(occurrenceId =>
          registerForOccurrence(user.id, occurrenceId)
        )
      );

      const failedRegistrations = results.filter(r => !r.success);

      if (failedRegistrations.length > 0) {
        const errorMessage = failedRegistrations
          .map(r => r.error)
          .filter(Boolean)
          .join(', ');
        throw new Error(errorMessage || 'Some registrations failed');
      }

      setShowPayment(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to complete registration');
    } finally {
      setProcessing(false);
    }
  }

  async function handlePaymentSuccess(paymentIntentId: string) {
    setCompleted(true);
  }

  function downloadCalendar() {
    const icsEvents = occurrences.map(occ => {
      const startDate = new Date(`${occ.occurrence_date}T${occ.start_time}`);
      const endDate = new Date(`${occ.occurrence_date}T${occ.end_time}`);

      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      return [
        'BEGIN:VEVENT',
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${seriesTitle}`,
        `DESCRIPTION:${seriesTitle}`,
        `LOCATION:${occ.courts?.name || 'TBD'}`,
        'END:VEVENT'
      ].join('\r\n');
    }).join('\r\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PaddleGrid//Event Series//EN',
      icsEvents,
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${seriesTitle.replace(/\s+/g, '-')}.ics`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (completed) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-lg w-full p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">
              You are now registered for {occurrenceIds.length}{' '}
              {occurrenceIds.length === 1 ? 'session' : 'sessions'} of {seriesTitle}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-3">Your Sessions:</h3>
              <div className="space-y-2 text-sm">
                {occurrences.map(occ => (
                  <div key={occ.id} className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {new Date(occ.occurrence_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}{' '}
                      at {occ.start_time.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={downloadCalendar}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="w-5 h-5" />
                Add to Calendar
              </button>
              <button
                onClick={onComplete}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-lg w-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold">Payment</h2>
                <p className="text-gray-600 mt-1">{seriesTitle}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <StripeSeriesPayment
              seriesId={seriesId}
              occurrenceIds={occurrenceIds}
              amount={totalPrice}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPayment(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Complete Registration</h2>
          <p className="text-gray-600 mt-1">{seriesTitle}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Registration Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sessions</span>
                <span className="font-medium">{occurrenceIds.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price per session</span>
                <span className="font-medium">${pricePerSession}</span>
              </div>
              {discountPercentage > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-{discountPercentage}%</span>
                </div>
              )}
              <div className="pt-2 border-t border-blue-200 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Selected Sessions
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {occurrences.map(occ => (
                <div key={occ.id} className="text-sm text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  {new Date(occ.occurrence_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}{' '}
                  at {occ.start_time.slice(0, 5)}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleProceedToPayment}
            disabled={processing}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              'Processing...'
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Proceed to Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
