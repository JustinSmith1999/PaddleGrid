import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, Calendar, Users, DollarSign, TrendingUp, ArrowUpDown } from 'lucide-react';
import { autoSyncEventsIfNeeded } from '../lib/autoSyncEvents';

interface Series {
  id: string;
  title: string;
  description: string;
  event_type: string;
  skill_level_min: number;
  skill_level_max: number;
  price_per_session: number;
  series_discount_percentage: number;
  max_participants_per_session: number;
  allow_partial_registration: boolean;
  occurrences: any[];
}

interface SeriesBrowserProps {
  onSeriesClick: (seriesId: string) => void;
}

export default function SeriesBrowser({ onSeriesClick }: SeriesBrowserProps) {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSkillLevel, setFilterSkillLevel] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(3);
  const [sortBy, setSortBy] = useState<'date' | 'price_low' | 'price_high' | 'availability' | 'title'>('date');

  useEffect(() => {
    autoSyncEventsIfNeeded();
    loadSeries();
  }, []);

  async function loadSeries() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_series')
        .select(`
          *,
          occurrences:event_series_occurrences(
            id,
            occurrence_date,
            start_time,
            end_time,
            current_registrants,
            max_participants,
            status
          )
        `)
        .eq('is_published', true)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const seriesWithUpcoming = (data || []).map(s => ({
        ...s,
        occurrences: (s.occurrences || []).filter(
          (occ: any) =>
            occ.occurrence_date >= new Date().toISOString().split('T')[0] &&
            occ.status === 'scheduled'
        )
      })).filter(s => s.occurrences.length > 0);

      setSeries(seriesWithUpcoming);
    } catch (error) {
      console.error('Error loading series:', error);
    } finally {
      setLoading(false);
    }
  }

  function getAvailableSpots(s: Series): number {
    return s.occurrences.reduce(
      (total, occ) => total + (occ.max_participants - occ.current_registrants),
      0
    );
  }

  function getEarliestDate(s: Series): string {
    if (s.occurrences.length === 0) return '';
    return s.occurrences[0].occurrence_date;
  }

  const filteredSeries = series.filter(s => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || s.event_type === filterType;

    const matchesSkill =
      filterSkillLevel === null ||
      (filterSkillLevel >= s.skill_level_min && filterSkillLevel <= s.skill_level_max);

    return matchesSearch && matchesType && matchesSkill;
  });

  const sortedSeries = [...filteredSeries].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return getEarliestDate(a).localeCompare(getEarliestDate(b));
      case 'price_low':
        return a.price_per_session - b.price_per_session;
      case 'price_high':
        return b.price_per_session - a.price_per_session;
      case 'availability':
        return getAvailableSpots(b) - getAvailableSpots(a);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

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

  function getEventTypeColor(type: string): string {
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">Event Series</h1>
          <p className="text-xl text-blue-100 mb-8">
            Join recurring events, clinics, and leagues designed for your skill level
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  placeholder="Search series..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-white/20 rounded-lg border border-white/30">
                <ArrowUpDown className="w-5 h-5 text-white/80" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
                >
                  <option value="date" className="bg-blue-700">Earliest Date</option>
                  <option value="price_low" className="bg-blue-700">Price: Low to High</option>
                  <option value="price_high" className="bg-blue-700">Price: High to Low</option>
                  <option value="availability" className="bg-blue-700">Most Available</option>
                  <option value="title" className="bg-blue-700">Name (A-Z)</option>
                </select>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition border border-white/30"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="all">All Types</option>
                    <option value="open_play">Open Play</option>
                    <option value="clinic">Clinic</option>
                    <option value="tournament">Tournament</option>
                    <option value="league">League</option>
                    <option value="social">Social</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Your Skill Level</label>
                  <select
                    value={filterSkillLevel || ''}
                    onChange={(e) =>
                      setFilterSkillLevel(e.target.value ? parseFloat(e.target.value) : null)
                    }
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="">All Levels</option>
                    <option value="2.0">2.0</option>
                    <option value="2.5">2.5</option>
                    <option value="3.0">3.0</option>
                    <option value="3.5">3.5</option>
                    <option value="4.0">4.0</option>
                    <option value="4.5">4.5</option>
                    <option value="5.0">5.0+</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading series...</div>
          </div>
        ) : sortedSeries.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No series found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedSeries.slice(0, displayCount).map((s) => {
                const availableSpots = getAvailableSpots(s);
                const firstOccurrence = s.occurrences[0];
                const lastOccurrence = s.occurrences[s.occurrences.length - 1];

                return (
                  <div
                    key={s.id}
                    onClick={() => onSeriesClick(s.id)}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${getEventTypeColor(
                            s.event_type
                          )}`}
                        >
                          {getEventTypeLabel(s.event_type)}
                        </span>
                        <span className="text-sm font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          {s.skill_level_min} - {s.skill_level_max}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{s.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{s.description}</p>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {new Date(firstOccurrence.occurrence_date).toLocaleDateString()} -{' '}
                            {new Date(lastOccurrence.occurrence_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>
                            {s.occurrences.length} sessions • {availableSpots} spots available
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span>
                            ${s.price_per_session}/session
                            {s.series_discount_percentage > 0 &&
                              ` • ${s.series_discount_percentage}% off`}
                          </span>
                        </div>
                      </div>

                      {availableSpots > 0 ? (
                        <div className="pt-4 border-t border-gray-100">
                          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                            View Details
                          </button>
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-gray-100">
                          <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
                            Join Waitlist
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {displayCount < sortedSeries.length && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setDisplayCount(prev => Math.min(prev + 6, sortedSeries.length))}
                  className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition font-medium"
                >
                  Show More ({sortedSeries.length - displayCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
