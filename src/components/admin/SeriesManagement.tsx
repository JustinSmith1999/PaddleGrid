import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Users, DollarSign, TrendingUp, Plus, Search, Filter, Archive, Edit, Eye, Lock, CalendarRange, Loader2, Tag, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  max_participants?: number;
}

interface SeriesManagementProps {
  onCreateNew: () => void;
  onEdit: (seriesId: string) => void;
  onViewDetails: (seriesId: string) => void;
}

type FilterTab = 'all' | 'published' | 'draft' | 'archived';

export default function SeriesManagement({ onCreateNew, onEdit, onViewDetails }: SeriesManagementProps) {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterTab>('all');
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSeries();
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

      // Load participant counts
      if (data && data.length > 0) {
        const { data: signups } = await supabase
          .from('series_signups')
          .select('series_id')
          .in('series_id', data.map(s => s.id));

        const counts: Record<string, number> = {};
        signups?.forEach(s => {
          counts[s.series_id] = (counts[s.series_id] || 0) + 1;
        });
        setParticipantCounts(counts);
      }
    } catch (error) {
      console.error('Error loading series:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredSeries = useMemo(() => {
    if (!searchTerm) return series;
    const term = searchTerm.toLowerCase();
    return series.filter(s =>
      s.title?.toLowerCase().includes(term) ||
      s.event_type?.toLowerCase().includes(term) ||
      s.description?.toLowerCase().includes(term)
    );
  }, [series, searchTerm]);

  const getEventTypeConfig = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'league': return { icon: <Zap className="w-4 h-4" />, color: 'bg-violet-50 text-violet-600', gradient: 'from-violet-500 to-purple-600' };
      case 'tournament': return { icon: <TrendingUp className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600', gradient: 'from-blue-500 to-blue-700' };
      case 'clinic': return { icon: <Users className="w-4 h-4" />, color: 'bg-amber-50 text-amber-600', gradient: 'from-amber-500 to-orange-600' };
      case 'social': return { icon: <CalendarRange className="w-4 h-4" />, color: 'bg-teal-50 text-teal-600', gradient: 'from-teal-500 to-teal-700' };
      default: return { icon: <Calendar className="w-4 h-4" />, color: 'bg-green-50 text-green-600', gradient: 'from-green-500 to-green-700' };
    }
  };

  const getSkillLabel = (min: number, max: number) => {
    if (min <= 1 && max >= 5) return 'All Levels';
    if (min <= 2 && max <= 3) return 'Beginner';
    if (min >= 3 && max <= 4) return 'Intermediate';
    if (min >= 4) return 'Advanced';
    return `${min}-${max}`;
  };

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'Active' },
    { id: 'published', label: 'Published' },
    { id: 'draft', label: 'Drafts' },
    { id: 'archived', label: 'Archived' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Events & Leagues
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {series.length} {filterType === 'all' ? 'active' : filterType} events
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                filterType === tab.id
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 text-green-700 animate-spin" />
          <p className="text-sm text-slate-500">Loading events...</p>
        </div>
      ) : (
        /* Event Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredSeries.map((event, index) => {
              const config = getEventTypeConfig(event.event_type);
              const participants = participantCounts[event.id] || 0;
              const maxP = event.max_participants || 16;
              const fillPercent = Math.min((participants / maxP) * 100, 100);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  layout
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-green-100 transition-all group cursor-pointer overflow-hidden"
                  onClick={() => onViewDetails(event.id)}
                >
                  {/* Color Header Bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

                  <div className="p-5">
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl ${config.color} flex items-center justify-center`}>
                        {config.icon}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!event.is_published && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">DRAFT</span>
                        )}
                        {event.synced_from_courtreserve && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">SYNCED</span>
                        )}
                        {event.is_published && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">LIVE</span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-green-700 transition-colors">
                      {event.title}
                    </h3>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs text-slate-400 capitalize">{event.event_type || 'Event'}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{getSkillLabel(event.skill_level_min, event.skill_level_max)}</span>
                    </div>

                    {/* Participant Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-600">{participants}/{maxP}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{fillPercent.toFixed(0)}% filled</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPercent}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">
                          {event.price_per_session > 0 ? `$${event.price_per_session}` : 'Free'}
                        </span>
                        {event.price_per_session > 0 && (
                          <span className="text-[10px] text-slate-400">/session</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); onEdit(event.id); }}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); onViewDetails(event.id); }}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredSeries.length === 0 && !loading && (
            <div className="col-span-full text-center py-16">
              <CalendarRange className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No events found</p>
              <button
                onClick={onCreateNew}
                className="mt-3 text-sm text-green-700 font-medium hover:text-green-800"
              >
                Create your first event →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
