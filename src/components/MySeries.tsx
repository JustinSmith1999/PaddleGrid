import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { cancelRegistration, formatTimeRange } from '../lib/seriesUtils';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, MapPin, TrendingUp, XCircle, CheckCircle } from 'lucide-react';
import { autoSyncEventsIfNeeded } from '../lib/autoSyncEvents';

interface Registration {
  id: string;
  status: string;
  amount_paid: number;
  checked_in_at: string | null;
  event_series_occurrences: {
    id: string;
    occurrence_date: string;
    start_time: string;
    end_time: string;
    status: string;
    courts: { name: string };
    event_series: {
      id: string;
      title: string;
      event_type: string;
    };
  };
}

interface MySeriesProps {
  onSeriesClick?: (seriesId: string) => void;
}

export default function MySeries({ onSeriesClick }: MySeriesProps) {
  const { user } = useAuth();
  const [upcomingRegistrations, setUpcomingRegistrations] = useState<Registration[]>([]);
  const [pastRegistrations, setPastRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    autoSyncEventsIfNeeded();
    if (user) {
      loadRegistrations();
    }
  }, [user]);

  async function loadRegistrations() {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_series_registrations')
        .select(`
          *,
          event_series_occurrences!inner(
            id,
            occurrence_date,
            start_time,
            end_time,
            status,
            courts(name),
            event_series!inner(id, title, event_type)
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['registered', 'attended', 'waitlisted'])
        .order('event_series_occurrences(occurrence_date)', { ascending: true });

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];

      const upcoming = (data || []).filter(
        (reg: any) => reg.event_series_occurrences.occurrence_date >= today
      );

      const past = (data || []).filter(
        (reg: any) => reg.event_series_occurrences.occurrence_date < today
      );

      setUpcomingRegistrations(upcoming);
      setPastRegistrations(past);
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelRegistration(registrationId: string) {
    if (!confirm('Are you sure you want to cancel this registration?')) return;

    try {
      const result = await cancelRegistration(registrationId);
      if (result.success) {
        loadRegistrations();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      alert('Failed to cancel registration');
    }
  }

  function getEventTypeColor(type: string): string {
    const colors: Record<string, string> = {
      open_play: 'bg-blue-100 text-blue-800',
      clinic: 'bg-green-100 text-green-800',
      tournament: 'bg-purple-100 text-purple-800',
      league: 'bg-orange-100 text-orange-800',
      social: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  function getEventTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      open_play: 'Open Play',
      clinic: 'Clinic',
      tournament: 'Tournament',
      league: 'League',
      social: 'Social'
    };
    return labels[type] || type;
  }

  const registrations = view === 'upcoming' ? upcomingRegistrations : pastRegistrations;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Sign in to view your series</h3>
          <p className="text-gray-600">Access your registered series and upcoming sessions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">My Series</h1>
          <p className="text-xl text-blue-100">
            Manage your registered series and view your schedule
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setView('upcoming')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  view === 'upcoming'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upcoming ({upcomingRegistrations.length})
              </button>
              <button
                onClick={() => setView('past')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  view === 'past'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Past ({pastRegistrations.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading your series...
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {view === 'upcoming'
                  ? 'No upcoming sessions'
                  : 'No past sessions'}
              </h3>
              <p className="text-gray-600 mb-6">
                {view === 'upcoming'
                  ? 'Browse available series to get started'
                  : 'Your attended sessions will appear here'}
              </p>
              {view === 'upcoming' && (
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Browse Series
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {registrations.map((reg) => {
                const occ = reg.event_series_occurrences;
                const series = occ.event_series;
                const isToday =
                  occ.occurrence_date === new Date().toISOString().split('T')[0];

                return (
                  <div key={reg.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <button
                            onClick={() => onSeriesClick?.(series.id)}
                            className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition"
                          >
                            {series.title}
                          </button>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(
                              series.event_type
                            )}`}
                          >
                            {getEventTypeLabel(series.event_type)}
                          </span>
                          {isToday && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              Today
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(occ.occurrence_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeRange(occ.start_time, occ.end_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{occ.courts?.name || 'Court TBD'}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              reg.status === 'attended'
                                ? 'bg-green-100 text-green-700'
                                : reg.status === 'registered'
                                ? 'bg-blue-100 text-blue-700'
                                : reg.status === 'waitlisted'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {reg.status === 'attended' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                            {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                          </span>
                          {reg.amount_paid > 0 && (
                            <span className="text-xs text-gray-600">
                              Paid ${reg.amount_paid}
                            </span>
                          )}
                        </div>
                      </div>

                      {view === 'upcoming' && reg.status === 'registered' && (
                        <button
                          onClick={() => handleCancelRegistration(reg.id)}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {view === 'past' && pastRegistrations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold">Your Activity</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">{pastRegistrations.length}</div>
                <div className="text-sm text-gray-600 mt-1">Total Sessions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {pastRegistrations.filter(r => r.status === 'attended').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Attended</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round(
                    (pastRegistrations.filter(r => r.status === 'attended').length /
                      pastRegistrations.length) *
                      100
                  )}
                  %
                </div>
                <div className="text-sm text-gray-600 mt-1">Attendance Rate</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
