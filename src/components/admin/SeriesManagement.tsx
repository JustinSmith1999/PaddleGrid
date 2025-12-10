import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getSeriesStats } from '../../lib/seriesUtils';
import { Calendar, Users, DollarSign, TrendingUp, Plus, Search, Filter, Archive, Edit, Copy, Eye, Lock } from 'lucide-react';

interface Series {
  id: string;
  title: string;
  description: string;
  event_type: string;
  skill_level_min: number;
  skill_level_max: number;
  price_per_session: number;
  is_published: boolean;
  is_archived: boolean;
  created_at: string;
  synced_from_courtreserve?: boolean;
  courtreserve_event_id?: string;
}

interface SeriesManagementProps {
  onCreateNew: () => void;
  onEdit: (seriesId: string) => void;
  onViewDetails: (seriesId: string) => void;
}

export default function SeriesManagement({ onCreateNew, onEdit, onViewDetails }: SeriesManagementProps) {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [stats, setStats] = useState<Record<string, any>>({});

  useEffect(() => {
    loadSeries();
    loadOverallStats();
  }, [filterType]);

  async function loadSeries() {
    setLoading(true);
    try {
      let query = supabase
        .from('event_series')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterType === 'published') {
        query = query.eq('is_published', true).eq('is_archived', false);
      } else if (filterType === 'draft') {
        query = query.eq('is_published', false).eq('is_archived', false);
      } else if (filterType === 'archived') {
        query = query.eq('is_archived', true);
      } else {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSeries(data || []);

      for (const s of data || []) {
        loadSeriesStats(s.id);
      }
    } catch (error) {
      console.error('Error loading series:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSeriesStats(seriesId: string) {
    try {
      const seriesStats = await getSeriesStats(seriesId);
      setStats(prev => ({ ...prev, [seriesId]: seriesStats }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadOverallStats() {
    try {
      const { data: allSeries } = await supabase
        .from('event_series')
        .select('id')
        .eq('is_archived', false);

      const { data: upcomingOccurrences } = await supabase
        .from('event_series_occurrences')
        .select('id')
        .gte('occurrence_date', new Date().toISOString().split('T')[0])
        .eq('status', 'scheduled');

      const { data: totalRegistrations } = await supabase
        .from('event_series_registrations')
        .select('id, amount_paid')
        .in('status', ['registered', 'attended']);

      const totalRevenue = totalRegistrations?.reduce((sum, reg) => sum + (parseFloat(reg.amount_paid as any) || 0), 0) || 0;

      setStats(prev => ({
        ...prev,
        overall: {
          totalSeries: allSeries?.length || 0,
          upcomingSessions: upcomingOccurrences?.length || 0,
          totalRegistrations: totalRegistrations?.length || 0,
          totalRevenue
        }
      }));
    } catch (error) {
      console.error('Error loading overall stats:', error);
    }
  }

  async function duplicateSeries(seriesId: string) {
    try {
      const { data: original, error: fetchError } = await supabase
        .from('event_series')
        .select('*')
        .eq('id', seriesId)
        .single();

      if (fetchError || !original) throw fetchError;

      if (original.synced_from_courtreserve) {
        alert('Cannot duplicate events synced from CourtReserve. Please create duplicates in CourtReserve instead.');
        return;
      }

      const { title, id, created_at, updated_at, synced_from_courtreserve, courtreserve_event_id, ...restData } = original;

      const { error: insertError } = await supabase
        .from('event_series')
        .insert({
          ...restData,
          title: `${title} (Copy)`,
          is_published: false
        });

      if (insertError) throw insertError;

      loadSeries();
    } catch (error) {
      console.error('Error duplicating series:', error);
      alert('Failed to duplicate series');
    }
  }

  async function archiveSeries(seriesId: string) {
    if (!confirm('Are you sure you want to archive this series?')) return;

    try {
      const { error } = await supabase
        .from('event_series')
        .update({ is_archived: true })
        .eq('id', seriesId);

      if (error) throw error;

      loadSeries();
    } catch (error) {
      console.error('Error archiving series:', error);
      alert('Failed to archive series');
    }
  }

  const filteredSeries = series.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Event Series Management</h1>
          <p className="text-gray-600 mt-1">Create and manage recurring events and programs</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Create New Series
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Series</p>
              <p className="text-2xl font-bold">{stats.overall?.totalSeries || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Upcoming Sessions</p>
              <p className="text-2xl font-bold">{stats.overall?.upcomingSessions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Registrations</p>
              <p className="text-2xl font-bold">{stats.overall?.totalRegistrations || 0}</p>
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
              <p className="text-2xl font-bold">${stats.overall?.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search series..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg transition ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('published')}
                className={`px-4 py-2 rounded-lg transition ${
                  filterType === 'published'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setFilterType('draft')}
                className={`px-4 py-2 rounded-lg transition ${
                  filterType === 'draft'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Draft
              </button>
              <button
                onClick={() => setFilterType('archived')}
                className={`px-4 py-2 rounded-lg transition ${
                  filterType === 'archived'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Archived
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading series...
            </div>
          ) : filteredSeries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No series found</p>
              <button
                onClick={onCreateNew}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first series
              </button>
            </div>
          ) : (
            filteredSeries.map((s) => (
              <div key={s.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{s.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(s.event_type)}`}>
                        {getEventTypeLabel(s.event_type)}
                      </span>
                      {!s.is_published && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Draft
                        </span>
                      )}
                      {s.is_archived && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Archived
                        </span>
                      )}
                      {s.synced_from_courtreserve && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          CourtReserve
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{s.description}</p>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>Skill Level: {s.skill_level_min} - {s.skill_level_max}</span>
                      <span>${s.price_per_session}/session</span>
                      {stats[s.id] && (
                        <>
                          <span>{stats[s.id].upcomingOccurrences} upcoming</span>
                          <span>{stats[s.id].totalRegistrations} registrations</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onViewDetails(s.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onEdit(s.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title={s.synced_from_courtreserve ? "View (Read-Only)" : "Edit"}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    {!s.synced_from_courtreserve && (
                      <button
                        onClick={() => duplicateSeries(s.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Duplicate"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    )}
                    {!s.is_archived && (
                      <button
                        onClick={() => archiveSeries(s.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Archive"
                      >
                        <Archive className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
