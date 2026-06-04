import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading series details...</div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Series not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-green-700 mb-6 transition text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Series
          </button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-green-50 text-green-700 rounded-lg px-3 py-1 text-xs font-semibold">
                    {getEventTypeLabel(series.event_type)}
                  </span>
                  <span className="bg-slate-100 text-slate-600 rounded-lg px-3 py-1 text-xs font-semibold">
                    Skill: {series.skill_level_min} - {series.skill_level_max}
                  </span>
                </div>
                <h1
                  className="text-2xl font-bold text-slate-900 mb-2"
                >
                  {series.title}
                </h1>
                <p className="text-slate-500 mb-6">{series.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
                    <Calendar className="w-5 h-5 text-green-700" />
                    <div>
                      <div className="text-xs text-slate-500">Sessions</div>
                      <div className="font-semibold text-slate-900 text-sm">{occurrences.length}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
                    <Users className="w-5 h-5 text-green-700" />
                    <div>
                      <div className="text-xs text-slate-500">Max Capacity</div>
                      <div className="font-semibold text-slate-900 text-sm">{series.max_participants_per_session} per session</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
                    <DollarSign className="w-5 h-5 text-green-700" />
                    <div>
                      <div className="text-xs text-slate-500">Price</div>
                      <div className="font-semibold text-slate-900 text-sm">${series.price_per_session}/session</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sessions List */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm"
            >
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h2
                    className="text-lg font-bold text-slate-900"
                  >
                    Select Sessions
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-sm text-green-700 hover:text-green-800 font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-slate-200">|</span>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {series.series_discount_percentage > 0 && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    Register for all sessions and save {series.series_discount_percentage}%!
                  </p>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {occurrences.map((occ, index) => {
                  const isRegistered = userRegistrations.includes(occ.id);
                  const isSelected = selectedOccurrences.has(occ.id);
                  const isFull = occ.current_registrants >= occ.max_participants;
                  const spotsLeft = occ.max_participants - occ.current_registrants;
                  const status = getOccurrenceStatus(occ);

                  return (
                    <label
                      key={occ.id}
                      className={`flex items-center gap-4 p-5 transition ${
                        isRegistered
                          ? 'bg-green-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-green-50/50'
                          : 'hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      {isRegistered ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOccurrence(occ.id)}
                          disabled={isRegistered}
                          className="w-5 h-5 text-green-700 rounded focus:ring-2 focus:ring-green-600 flex-shrink-0 accent-green-700"
                        />
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1.5">
                          <div className="font-semibold text-slate-900 text-sm">
                            {new Date(occ.occurrence_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {status === 'today' && (
                            <span className="bg-green-50 text-green-700 rounded-lg px-3 py-1 text-xs font-semibold">
                              Today
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-5 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTimeRange(occ.start_time, occ.end_time)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {occ.courts?.name || 'Court TBD'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
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
                          <span className="text-green-700 font-semibold text-sm">Registered</span>
                        ) : (
                          <div className="font-semibold text-slate-900 text-sm">
                            ${series.price_per_session}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Registration Summary Sidebar */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm sticky top-6"
            >
              <div className="p-6 border-b border-slate-100">
                <h3
                  className="text-lg font-bold text-slate-900 mb-4"
                >
                  Registration Summary
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sessions Selected</span>
                    <span className="font-semibold text-slate-900">{selectedOccurrences.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Price Per Session</span>
                    <span className="font-semibold text-slate-900">${series.price_per_session}</span>
                  </div>

                  {selectedOccurrences.size === occurrences.length &&
                    series.series_discount_percentage > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span className="font-medium">Full Series Discount</span>
                        <span className="font-semibold">-{series.series_discount_percentage}%</span>
                      </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-lg font-bold text-slate-900">
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
                    className="w-full py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedOccurrences.size === 0
                      ? 'Select Sessions to Continue'
                      : `Register for ${selectedOccurrences.size} ${
                          selectedOccurrences.size === 1 ? 'Session' : 'Sessions'
                        }`}
                  </button>

                  {!series.allow_partial_registration && (
                    <p className="text-xs text-slate-500 mt-3 text-center">
                      Full series registration required
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-center text-slate-500 mb-4 text-sm">Sign in to register</p>
                  <button
                    onClick={() => alert('Please sign in to register')}
                    className="w-full py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition font-semibold shadow-sm"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
