import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateSeriesPrice, formatTimeRange, getOccurrenceStatus } from '../lib/seriesUtils';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SeriesDetailProps {
  seriesId: string;
  onBack: () => void;
  onRegister: (seriesId: string, selectedOccurrences: string[]) => void;
}

interface Occurrence {
  id: string;
  occurrence_date: string;
  start_time: string;
  end_time: string;
  current_registrants: number;
  max_participants: number;
  waitlist_count: number;
  status: string;
  courts: { name: string };
}

export default function SeriesDetail({ seriesId, onBack, onRegister }: SeriesDetailProps) {
  const { user } = useAuth();
  const [series, setSeries] = useState<any>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [selectedOccurrences, setSelectedOccurrences] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);

  useEffect(() => {
    loadSeriesData();
  }, [seriesId]);

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
        .gte('occurrence_date', new Date().toISOString().split('T')[0])
        .eq('status', 'scheduled')
        .order('occurrence_date');

      if (occError) throw occError;
      setOccurrences(occurrencesData || []);

      if (user) {
        const { data: registrations } = await supabase
          .from('event_series_registrations')
          .select('occurrence_id')
          .eq('series_id', seriesId)
          .eq('user_id', user.id)
          .in('status', ['registered', 'attended', 'waitlisted']);

        setUserRegistrations(registrations?.map(r => r.occurrence_id) || []);
      }
    } catch (error) {
      console.error('Error loading series data:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleOccurrence(occurrenceId: string) {
    const newSelected = new Set(selectedOccurrences);
    if (newSelected.has(occurrenceId)) {
      newSelected.delete(occurrenceId);
    } else {
      newSelected.add(occurrenceId);
    }
    setSelectedOccurrences(newSelected);
  }

  function selectAll() {
    const availableOccurrences = occurrences
      .filter(occ => !userRegistrations.includes(occ.id))
      .map(occ => occ.id);
    setSelectedOccurrences(new Set(availableOccurrences));
  }

  function clearSelection() {
    setSelectedOccurrences(new Set());
  }

  const totalPrice = calculateSeriesPrice(
    series?.price_per_session || 0,
    selectedOccurrences.size,
    selectedOccurrences.size === occurrences.length ? series?.series_discount_percentage || 0 : 0
  );

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      open_play: 'Open Play',
      clinic: 'Clinic',
      tournament: 'Tournament',
      league: 'League',
      social: 'Social'
    };
    return labels[type] || type;
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      open_play: 'bg-blue-100 text-blue-800',
      clinic: 'bg-green-100 text-green-800',
      tournament: 'bg-purple-100 text-purple-800',
      league: 'bg-orange-100 text-orange-800',
      social: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Series
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(series.event_type)}`}>
                  {getEventTypeLabel(series.event_type)}
                </span>
                <span className="text-white/80">
                  Skill Level: {series.skill_level_min} - {series.skill_level_max}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-4">{series.title}</h1>
              <p className="text-xl text-blue-100 mb-6">{series.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Calendar className="w-6 h-6" />
                  <div>
                    <div className="text-sm text-blue-100">Sessions</div>
                    <div className="font-semibold">{occurrences.length}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Users className="w-6 h-6" />
                  <div>
                    <div className="text-sm text-blue-100">Max Capacity</div>
                    <div className="font-semibold">{series.max_participants_per_session} per session</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <DollarSign className="w-6 h-6" />
                  <div>
                    <div className="text-sm text-blue-100">Price</div>
                    <div className="font-semibold">${series.price_per_session}/session</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Select Sessions</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {series.series_discount_percentage > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    Register for all sessions and save {series.series_discount_percentage}%!
                  </p>
                )}
              </div>

              <div className="divide-y divide-gray-200">
                {occurrences.map((occ) => {
                  const isRegistered = userRegistrations.includes(occ.id);
                  const isSelected = selectedOccurrences.has(occ.id);
                  const isFull = occ.current_registrants >= occ.max_participants;
                  const spotsLeft = occ.max_participants - occ.current_registrants;
                  const status = getOccurrenceStatus(occ);

                  return (
                    <label
                      key={occ.id}
                      className={`flex items-center gap-4 p-6 transition ${
                        isRegistered
                          ? 'bg-green-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {isRegistered ? (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOccurrence(occ.id)}
                          disabled={isRegistered}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                        />
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-semibold text-gray-900">
                            {new Date(occ.occurrence_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {status === 'today' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Today
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatTimeRange(occ.start_time, occ.end_time)}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {occ.courts?.name || 'Court TBD'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {isFull ? (
                              <span className="text-red-600 font-medium">Full</span>
                            ) : (
                              <span>
                                {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isRegistered ? (
                          <span className="text-green-600 font-medium">Registered</span>
                        ) : (
                          <div className="font-semibold text-gray-900">
                            ${series.price_per_session}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Registration Summary</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sessions Selected</span>
                    <span className="font-medium">{selectedOccurrences.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price Per Session</span>
                    <span className="font-medium">${series.price_per_session}</span>
                  </div>

                  {selectedOccurrences.size === occurrences.length &&
                    series.series_discount_percentage > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Full Series Discount</span>
                        <span className="font-medium">-{series.series_discount_percentage}%</span>
                      </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {user ? (
                <div className="p-6">
                  <button
                    onClick={() => onRegister(seriesId, Array.from(selectedOccurrences))}
                    disabled={selectedOccurrences.size === 0}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedOccurrences.size === 0
                      ? 'Select Sessions to Continue'
                      : `Register for ${selectedOccurrences.size} ${
                          selectedOccurrences.size === 1 ? 'Session' : 'Sessions'
                        }`}
                  </button>

                  {!series.allow_partial_registration && (
                    <p className="text-xs text-gray-600 mt-3 text-center">
                      Full series registration required
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-center text-gray-600 mb-4">Sign in to register</p>
                  <button
                    onClick={() => alert('Please sign in to register')}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
