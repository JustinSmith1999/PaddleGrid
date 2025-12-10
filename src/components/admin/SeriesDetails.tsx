import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getSeriesStats, checkInParticipant, getOccurrenceStatus, formatTimeRange } from '../../lib/seriesUtils';
import { ArrowLeft, Calendar, Users, DollarSign, TrendingUp, Download, CheckCircle, XCircle, Edit, Trash } from 'lucide-react';

interface SeriesDetailsProps {
  seriesId: string;
  onBack: () => void;
  onEdit: () => void;
}

interface Occurrence {
  id: string;
  occurrence_date: string;
  start_time: string;
  end_time: string;
  status: string;
  current_registrants: number;
  max_participants: number;
  waitlist_count: number;
  court_id: string;
  courts?: { name: string };
}

interface Registration {
  id: string;
  user_id: string;
  status: string;
  amount_paid: number;
  checked_in_at: string | null;
  profiles?: { full_name: string; email: string };
}

export default function SeriesDetails({ seriesId, onBack, onEdit }: SeriesDetailsProps) {
  const [series, setSeries] = useState<any>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [selectedOccurrence, setSelectedOccurrence] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeriesData();
  }, [seriesId]);

  useEffect(() => {
    if (selectedOccurrence) {
      loadRegistrations(selectedOccurrence);
    }
  }, [selectedOccurrence]);

  async function loadSeriesData() {
    setLoading(true);
    try {
      const { data: seriesData, error: seriesError } = await supabase
        .from('event_series')
        .select('*')
        .eq('id', seriesId)
        .single();

      if (seriesError) throw seriesError;
      setSeries(seriesData);

      const { data: occurrencesData, error: occError } = await supabase
        .from('event_series_occurrences')
        .select('*, courts(name)')
        .eq('series_id', seriesId)
        .order('occurrence_date');

      if (occError) throw occError;
      setOccurrences(occurrencesData || []);

      const seriesStats = await getSeriesStats(seriesId);
      setStats(seriesStats);

      if (occurrencesData && occurrencesData.length > 0) {
        setSelectedOccurrence(occurrencesData[0].id);
      }
    } catch (error) {
      console.error('Error loading series data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRegistrations(occurrenceId: string) {
    try {
      const { data, error } = await supabase
        .from('event_series_registrations')
        .select('*, profiles(full_name, email)')
        .eq('occurrence_id', occurrenceId)
        .order('registration_date');

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  }

  async function handleCheckIn(registrationId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await checkInParticipant(registrationId, user.id);
      if (result.success) {
        loadRegistrations(selectedOccurrence!);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error checking in participant:', error);
      alert('Failed to check in participant');
    }
  }

  async function handleCancelOccurrence(occurrenceId: string) {
    if (!confirm('Are you sure you want to cancel this occurrence? This will notify all registered participants.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('event_series_occurrences')
        .update({ status: 'cancelled' })
        .eq('id', occurrenceId);

      if (error) throw error;

      loadSeriesData();
      alert('Occurrence cancelled successfully');
    } catch (error) {
      console.error('Error cancelling occurrence:', error);
      alert('Failed to cancel occurrence');
    }
  }

  async function exportRegistrations() {
    if (!selectedOccurrence) return;

    const occ = occurrences.find(o => o.id === selectedOccurrence);
    if (!occ) return;

    const csvContent = [
      ['Name', 'Email', 'Status', 'Amount Paid', 'Checked In'],
      ...registrations.map(reg => [
        reg.profiles?.full_name || 'N/A',
        reg.profiles?.email || 'N/A',
        reg.status,
        `$${reg.amount_paid}`,
        reg.checked_in_at ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${occ.occurrence_date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading series details...</div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Series not found</div>
      </div>
    );
  }

  const selectedOcc = occurrences.find(o => o.id === selectedOccurrence);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{series.title}</h1>
            <p className="text-gray-600 mt-1">{series.description}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Edit className="w-5 h-5" />
          Edit Series
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold">{stats?.totalOccurrences || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Registrations</p>
              <p className="text-2xl font-bold">{stats?.totalRegistrations || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold">{stats?.averageAttendanceRate?.toFixed(0) || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold">Occurrences</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {occurrences.map((occ) => {
              const status = getOccurrenceStatus(occ);
              const fillPercentage = (occ.current_registrants / occ.max_participants) * 100;

              return (
                <button
                  key={occ.id}
                  onClick={() => setSelectedOccurrence(occ.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                    selectedOccurrence === occ.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">
                      {new Date(occ.occurrence_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : status === 'completed'
                          ? 'bg-gray-100 text-gray-700'
                          : status === 'today'
                          ? 'bg-green-100 text-green-700'
                          : status === 'past'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {status === 'today' ? 'Today' : status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {formatTimeRange(occ.start_time, occ.end_time)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {occ.courts?.name || 'Court TBD'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          fillPercentage >= 100 ? 'bg-red-500' : fillPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {occ.current_registrants}/{occ.max_participants}
                    </span>
                  </div>
                  {occ.waitlist_count > 0 && (
                    <div className="mt-1 text-xs text-orange-600">
                      {occ.waitlist_count} on waitlist
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Registrations</h3>
              {selectedOcc && (
                <p className="text-sm text-gray-600">
                  {new Date(selectedOcc.occurrence_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })} • {formatTimeRange(selectedOcc.start_time, selectedOcc.end_time)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportRegistrations}
                disabled={!selectedOccurrence || registrations.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              {selectedOcc && selectedOcc.status === 'scheduled' && (
                <button
                  onClick={() => handleCancelOccurrence(selectedOcc.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          </div>

          {!selectedOccurrence ? (
            <div className="p-12 text-center text-gray-500">
              Select an occurrence to view registrations
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No registrations yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {registrations.map((reg) => (
                <div key={reg.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{reg.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-600">{reg.profiles?.email}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            reg.status === 'attended'
                              ? 'bg-green-100 text-green-700'
                              : reg.status === 'registered'
                              ? 'bg-blue-100 text-blue-700'
                              : reg.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : reg.status === 'no_show'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {reg.status}
                        </span>
                        <span className="text-xs text-gray-600">
                          ${reg.amount_paid}
                        </span>
                      </div>
                    </div>

                    {reg.status === 'registered' && (
                      <button
                        onClick={() => handleCheckIn(reg.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Check In
                      </button>
                    )}

                    {reg.status === 'attended' && reg.checked_in_at && (
                      <div className="text-sm text-gray-600">
                        Checked in at{' '}
                        {new Date(reg.checked_in_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
