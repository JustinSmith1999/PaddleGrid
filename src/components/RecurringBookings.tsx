import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Repeat, Trash2, Plus } from 'lucide-react';
import { sortCourtsByNumber } from '../lib/courtUtils';

interface RecurringBooking {
  id: string;
  court_name: string;
  day_of_week: number;
  start_time: string;
  duration: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function RecurringBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<RecurringBooking[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    court_id: '',
    day_of_week: 1,
    start_time: '09:00',
    duration: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchCourts();
    }
  }, [user]);

  async function fetchBookings() {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('recurring_bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('day_of_week');

      if (data) {
        const bookingsWithCourts = await Promise.all(
          data.map(async (booking: any) => {
            const { data: court } = await supabase
              .from('courts')
              .select('name')
              .eq('id', booking.court_id)
              .single();

            return {
              ...booking,
              court_name: court?.name || 'Unknown Court'
            };
          })
        );

        setBookings(bookingsWithCourts);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourts() {
    try {
      const { data } = await supabase
        .from('courts')
        .select('id, name')
        .eq('status', 'available');

      setCourts(sortCourtsByNumber(data || []));
    } catch (error) {
      console.error('Error fetching courts:', error);
    }
  }

  async function createRecurringBooking() {
    try {
      const { error } = await supabase
        .from('recurring_bookings')
        .insert({
          user_id: user?.id,
          ...formData,
          end_date: formData.end_date || null
        });

      if (error) throw error;

      alert('Recurring booking created!');
      setShowAddForm(false);
      setFormData({
        court_id: '',
        day_of_week: 1,
        start_time: '09:00',
        duration: 1,
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      });
      fetchBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create recurring booking');
    }
  }

  async function toggleBooking(bookingId: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from('recurring_bookings')
        .update({ is_active: !isActive })
        .eq('id', bookingId);

      if (error) throw error;
      fetchBookings();
    } catch (error) {
      console.error('Error toggling booking:', error);
    }
  }

  async function deleteBooking(bookingId: string) {
    if (!confirm('Are you sure you want to delete this recurring booking?')) return;

    try {
      const { error } = await supabase
        .from('recurring_bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Repeat className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Recurring Bookings</h1>
              <p className="text-gray-600">Set up your regular court times</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Recurring Booking
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Create Recurring Booking</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Court</label>
              <select
                value={formData.court_id}
                onChange={(e) => setFormData({ ...formData, court_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a court</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>{court.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date (optional)</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={createRecurringBooking}
                disabled={!formData.court_id}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No recurring bookings yet. Click "New Recurring Booking" to get started!
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg">{booking.court_name}</h3>
                    {!booking.is_active && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                        Paused
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Day:</span> {DAYS_OF_WEEK[booking.day_of_week]}
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> {booking.start_time}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {booking.duration} hour(s)
                    </div>
                    <div>
                      <span className="font-medium">Starts:</span> {new Date(booking.start_date).toLocaleDateString()}
                    </div>
                    {booking.end_date && (
                      <div>
                        <span className="font-medium">Ends:</span> {new Date(booking.end_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleBooking(booking.id, booking.is_active)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      booking.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {booking.is_active ? 'Pause' : 'Resume'}
                  </button>

                  <button
                    onClick={() => deleteBooking(booking.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
