import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Bell, X, CheckCircle, AlertCircle } from 'lucide-react';

interface WaitlistEntry {
  id: string;
  facility_id: string;
  court_id: string | null;
  preferred_date: string;
  preferred_start_time: string;
  preferred_end_time: string;
  status: 'pending' | 'notified' | 'expired' | 'fulfilled';
  priority: number;
  notified_at: string | null;
  expires_at: string | null;
  created_at: string;
  facilities: {
    id: string;
    name: string;
  };
  courts?: {
    id: string;
    name: string;
  };
}

interface WaitlistManagementProps {
  facilityId?: string;
  onClose?: () => void;
}

export default function WaitlistManagement({ facilityId, onClose }: WaitlistManagementProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(facilityId || '');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadWaitlistEntries();
      loadFacilities();
    }
  }, [user]);

  useEffect(() => {
    if (selectedFacility) {
      loadCourts(selectedFacility);
    }
  }, [selectedFacility]);

  const loadWaitlistEntries = async () => {
    try {
      const query = supabase
        .from('waitlist_entries')
        .select(`
          *,
          facilities (id, name),
          courts (id, name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (facilityId) {
        query.eq('facility_id', facilityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading waitlist entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error('Error loading facilities:', error);
    }
  };

  const loadCourts = async (facilityId: string) => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name')
        .eq('facility_id', facilityId)
        .order('name');

      if (error) throw error;
      setCourts(data || []);
    } catch (error) {
      console.error('Error loading courts:', error);
    }
  };

  const handleAddToWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFacility || !preferredDate || !startTime || !endTime) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('waitlist_entries').insert({
        user_id: user.id,
        facility_id: selectedFacility,
        court_id: selectedCourt || null,
        preferred_date: preferredDate,
        preferred_start_time: startTime,
        preferred_end_time: endTime,
        duration_minutes: calculateDuration(startTime, endTime),
        status: 'pending'
      });

      if (error) throw error;

      setShowAddForm(false);
      setSelectedCourt('');
      setPreferredDate('');
      setStartTime('');
      setEndTime('');
      loadWaitlistEntries();
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      alert('Failed to add to waitlist. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveFromWaitlist = async (entryId: string) => {
    if (!confirm('Remove this entry from the waitlist?')) return;

    try {
      const { error } = await supabase
        .from('waitlist_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      loadWaitlistEntries();
    } catch (error) {
      console.error('Error removing from waitlist:', error);
    }
  };

  const calculateDuration = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" /> Waiting
        </span>;
      case 'notified':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
          <Bell className="w-3 h-3" /> Available!
        </span>;
      case 'expired':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Expired
        </span>;
      case 'fulfilled':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Booked
        </span>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading waitlist...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Court Waitlist</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAddForm ? 'Cancel' : 'Join Waitlist'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddToWaitlist} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Join Waitlist</h3>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facility
                </label>
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!facilityId}
                >
                  <option value="">Select facility</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Court (Optional)
                </label>
                <select
                  value={selectedCourt}
                  onChange={(e) => setSelectedCourt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedFacility}
                >
                  <option value="">Any court</option>
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="self-center">to</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add to Waitlist'}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No waitlist entries yet.</p>
              <p className="text-sm mt-1">Join a waitlist to get notified when courts become available!</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {entry.facilities.name}
                      </h3>
                      {getStatusBadge(entry.status)}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      {entry.courts && (
                        <p>Court: {entry.courts.name}</p>
                      )}
                      <p>Date: {new Date(entry.preferred_date).toLocaleDateString()}</p>
                      <p>Time: {entry.preferred_start_time.slice(0, 5)} - {entry.preferred_end_time.slice(0, 5)}</p>
                      <p>Priority: #{entry.priority}</p>
                      {entry.notified_at && (
                        <p className="text-green-600 font-medium">
                          Notified: {new Date(entry.notified_at).toLocaleString()}
                        </p>
                      )}
                      {entry.expires_at && entry.status === 'notified' && (
                        <p className="text-orange-600 font-medium">
                          Book before: {new Date(entry.expires_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFromWaitlist(entry.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from waitlist"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}