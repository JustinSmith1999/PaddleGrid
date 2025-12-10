import { useState } from 'react';
import { Bell, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BookingExtensionNotification from '../BookingExtensionNotification';

export default function BookingNotificationTest() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showExtensionUI, setShowExtensionUI] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [minutesBefore, setMinutesBefore] = useState(5);

  const checkExpiringBookings = async () => {
    try {
      setChecking(true);
      setResult(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/booking-expiry-check`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutesBefore })
      });

      const data = await response.json();
      setResult(data);

      if (data.success && data.details && data.details.length > 0) {
        setSelectedBookingId(data.details[0].booking_id);
      }
    } catch (error: any) {
      console.error('Error checking expiring bookings:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setChecking(false);
    }
  };

  const testExtensionUI = () => {
    if (selectedBookingId) {
      setShowExtensionUI(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-3 rounded-lg">
          <Bell className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Booking Notifications Test</h2>
          <p className="text-sm text-gray-600">Test the expiring booking notification system</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check bookings ending in (minutes):
          </label>
          <input
            type="number"
            value={minutesBefore}
            onChange={(e) => setMinutesBefore(parseInt(e.target.value) || 5)}
            min="1"
            max="60"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={checkExpiringBookings}
          disabled={checking}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {checking ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Checking...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Check for Expiring Bookings
            </>
          )}
        </button>
      </div>

      {result && (
        <div className={`rounded-xl p-4 ${result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <div className="flex items-start gap-3 mb-4">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`font-bold mb-1 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                {result.success ? 'Check Complete' : 'Check Failed'}
              </h3>
              {result.error && (
                <p className="text-sm text-red-700">{result.error}</p>
              )}
            </div>
          </div>

          {result.success && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Expiring Soon</p>
                  <p className="text-2xl font-bold text-gray-900">{result.expiring_bookings}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">{result.notifications_created}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Push Queued</p>
                  <p className="text-2xl font-bold text-gray-900">{result.push_notifications_queued}</p>
                </div>
              </div>

              {result.details && result.details.length > 0 && (
                <div className="bg-white rounded-lg border border-green-200">
                  <div className="p-3 border-b border-green-200">
                    <h4 className="font-semibold text-gray-900">Expiring Bookings</h4>
                  </div>
                  <div className="divide-y divide-green-100">
                    {result.details.map((detail: any, index: number) => (
                      <div key={index} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{detail.court_name}</p>
                            <p className="text-sm text-gray-600">
                              Ends: {new Date(detail.end_time).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {detail.can_extend && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                Can Extend
                              </span>
                            )}
                            {detail.has_alternative && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                Alt Available
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedBookingId(detail.booking_id);
                            testExtensionUI();
                          }}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-800 transition flex items-center justify-center gap-2"
                        >
                          <Clock className="w-4 h-4" />
                          Test Extension UI
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="text-xs text-gray-600">
                  Checked at: {new Date(result.checked_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Edge function checks for bookings ending soon</li>
          <li>Identifies if same court is available for extension</li>
          <li>Finds alternative courts if original is booked</li>
          <li>Sends push notifications to users</li>
          <li>Users can extend with one tap</li>
        </ol>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> In production, this function runs automatically every minute via a scheduled cron job.
            Push notifications will be sent to registered devices (iOS/Android/Web).
          </p>
        </div>
      </div>

      {showExtensionUI && selectedBookingId && (
        <BookingExtensionNotification
          bookingId={selectedBookingId}
          onClose={() => setShowExtensionUI(false)}
        />
      )}
    </div>
  );
}
