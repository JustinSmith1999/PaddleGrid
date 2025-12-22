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
      open_play: 'bg-emerald-100 text-emerald-800',
      clinic: 'bg-teal-100 text-teal-800',
      tournament: 'bg-cyan-100 text-cyan-800',
      league: 'bg-green-100 text-green-800',
      social: 'bg-lime-100 text-lime-800'
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Sign in to view your series</h3>
          <p className="text-slate-600">Access your registered series and upcoming sessions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
              <Calendar className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold">My Series</h1>
          </div>
          <p className="text-xl text-emerald-100 text-center">
            Manage your registered series and view your schedule
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setView('upcoming')}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  view === 'upcoming'
                    ? 'border-b-2 border-emerald-600 text-emerald-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upcoming ({upcomingRegistrations.length})
              </button>
              <button
                onClick={() => setView('past')}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  view === 'past'
                    ? 'border-b-2 border-emerald-600 text-emerald-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Past ({pastRegistrations.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Loading your series...
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {view === 'upcoming'
                  ? 'No upcoming sessions'
                  : 'No past sessions'}
              </h3>
              <p className="text-slate-600 mb-6">
                {view === 'upcoming'
                  ? 'Browse available series to get started'
                  : 'Your attended sessions will appear here'}
              </p>
              {view === 'upcoming' && (
                <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-semibold shadow-sm">
                  Browse Series
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {registrations.map((reg) => {
                const occ = reg.event_series_occurrences;
                const series = occ.event_series;
                const isToday =
                  occ.occurrence_date === new Date().toISOString().split('T')[0];

                return (
                  <div key={reg.id} className="p-6 hover:bg-emerald-50/50 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <button
                            onClick={() => onSeriesClick?.(series.id)}
                            className="font-semibold text-lg text-slate-900 hover:text-emerald-600 transition-all"
                          >
                            {series.title}
                          </button>
                          <span
                            className={`px-2 py-1 rounded-xl text-xs font-medium ${getEventTypeColor(
                              series.event_type
                            )}`}
                          >
                            {getEventTypeLabel(series.event_type)}
                          </span>
                          {isToday && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-medium">
                              Today
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            <span>
                              {new Date(occ.occurrence_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            <span>{formatTimeRange(occ.start_time, occ.end_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            <span>{occ.courts?.name || 'Court TBD'}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              reg.status === 'attended'
                                ? 'bg-emerald-100 text-emerald-700'
                                : reg.status === 'registered'
                                ? 'bg-teal-100 text-teal-700'
                                : reg.status === 'waitlisted'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {reg.status === 'attended' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                            {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                          </span>
                          {reg.amount_paid > 0 && (
                            <span className="text-xs text-slate-600">
                              Paid ${reg.amount_paid}
                            </span>
                          )}
                        </div>
                      </div>

                      {view === 'upcoming' && reg.status === 'registered' && (
                        <button
                          onClick={() => handleCancelRegistration(reg.id)}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-semibold">Your Activity</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-emerald-600">{pastRegistrations.length}</div>
                <div className="text-sm text-slate-600 mt-1">Total Sessions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-teal-600">
                  {pastRegistrations.filter(r => r.status === 'attended').length}
                </div>
                <div className="text-sm text-slate-600 mt-1">Attended</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cyan-600">
                  {Math.round(
                    (pastRegistrations.filter(r => r.status === 'attended').length /
                      pastRegistrations.length) *
                      100
                  )}
                  %
                </div>
                <div className="text-sm text-slate-600 mt-1">Attendance Rate</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
