import { useState, useEffect } from 'react';
import { Zap, Calendar, Clock, Users, CheckCircle, X, ArrowRight, Loader2, Sparkles, Target, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, fetchAllRows } from '../../lib/supabase';

interface SmartFillSuggestion {
  id: string;
  day: string;
  dayIndex: number;
  hour: number;
  type: 'open-play' | 'drop-in' | 'clinic' | 'social';
  title: string;
  description: string;
  estimatedPlayers: number;
  estimatedRevenue: number;
  confidence: 'high' | 'medium' | 'low';
  courtId?: string;
  courtName?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SmartFill() {
  const [suggestions, setSuggestions] = useState<SmartFillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateSuggestions();
  }, []);

  const generateSuggestions = async () => {
    try {
      // Fetch dead spot data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const bookings = await fetchAllRows(() =>
        supabase.from('court_availability_blocks')
          .select('block_date, start_time, court_id, courts(name)')
          .eq('block_type', 'reservation')
          .gte('block_date', thirtyDaysAgo.toISOString().split('T')[0])
      );

      const { data: courts } = await supabase.from('courts').select('id, name, hourly_rate');

      const totalCourts = courts?.length || 4;

      // Build heatmap
      const heatmap: Record<string, Record<number, number>> = {};
      DAYS.forEach(day => { heatmap[day] = {}; });

      bookings.forEach(b => {
        const date = new Date(b.block_date + 'T00:00:00');
        const dayName = DAYS[date.getDay()];
        const hour = parseInt(b.start_time.split(':')[0]);
        heatmap[dayName][hour] = (heatmap[dayName][hour] || 0) + 1;
      });

      // Find dead spots and generate suggestions
      const weeksInPeriod = 4.3;
      const generated: SmartFillSuggestion[] = [];

      DAYS.forEach((day, dayIndex) => {
        for (let h = 6; h <= 21; h++) {
          const avg = (heatmap[day][h] || 0) / weeksInPeriod;
          const utilization = avg / totalCourts;

          if (utilization < 0.25) { // less than 25% utilized
            const suggestion = generateSuggestionForSlot(day, dayIndex, h, utilization, totalCourts, courts);
            if (suggestion) generated.push(suggestion);
          }
        }
      });

      // Sort by revenue potential and take top 12
      generated.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
      setSuggestions(generated.slice(0, 12));
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestionForSlot = (
    day: string, dayIndex: number, hour: number, utilization: number,
    totalCourts: number, courts: any[] | null
  ): SmartFillSuggestion | null => {
    const isWeekend = dayIndex === 0 || dayIndex === 6;
    const isMorning = hour < 10;
    const isEvening = hour >= 17;
    const isMidDay = hour >= 11 && hour <= 14;

    let type: SmartFillSuggestion['type'] = 'open-play';
    let title = '';
    let description = '';
    let estimatedPlayers = 8;

    if (isWeekend && isMorning) {
      type = 'social';
      title = `${day} Morning Social`;
      description = 'Casual round-robin mixer for all levels';
      estimatedPlayers = 12;
    } else if (isMidDay) {
      type = 'drop-in';
      title = `Midday Drop-In (${day})`;
      description = 'No reservation needed — just show up and play';
      estimatedPlayers = 6;
    } else if (isEvening) {
      type = 'open-play';
      title = `${day} Evening Open Play`;
      description = 'Organized open play with skill-based court assignments';
      estimatedPlayers = 16;
    } else if (isMorning) {
      type = 'clinic';
      title = `Early Bird Clinic (${day})`;
      description = 'Skill-building clinic with pro instruction';
      estimatedPlayers = 8;
    } else {
      type = 'drop-in';
      title = `${day} ${hour > 12 ? 'Afternoon' : 'Morning'} Drop-In`;
      description = 'Walk-in play with automatic court rotation';
      estimatedPlayers = 6;
    }

    const courtRate = courts?.[0]?.hourly_rate || 30;
    const estimatedRevenue = estimatedPlayers * (courtRate / 4); // split rate per player

    return {
      id: `${dayIndex}-${hour}`,
      day,
      dayIndex,
      hour,
      type,
      title,
      description,
      estimatedPlayers,
      estimatedRevenue,
      confidence: utilization < 0.1 ? 'high' : utilization < 0.2 ? 'medium' : 'low',
      courtName: courts?.[0]?.name,
    };
  };

  const handlePublish = async (suggestion: SmartFillSuggestion) => {
    setPublishing(suggestion.id);
    // In production: create an event_series entry for this recurring slot
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPublishedIds(prev => new Set([...prev, suggestion.id]));
    setPublishing(null);
  };

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:00 ${period}`;
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'open-play': return { color: 'bg-green-50 text-green-700 border-green-200', icon: <Users className="w-4 h-4" />, label: 'Open Play' };
      case 'drop-in': return { color: 'bg-sky-50 text-sky-700 border-sky-200', icon: <Zap className="w-4 h-4" />, label: 'Drop-In' };
      case 'clinic': return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Target className="w-4 h-4" />, label: 'Clinic' };
      case 'social': return { color: 'bg-violet-50 text-violet-700 border-violet-200', icon: <Sparkles className="w-4 h-4" />, label: 'Social' };
      default: return { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: <Calendar className="w-4 h-4" />, label: 'Event' };
    }
  };

  const getConfidenceColor = (c: string) => {
    switch (c) {
      case 'high': return 'text-green-700 bg-green-50 border border-green-200';
      case 'medium': return 'text-amber-700 bg-amber-50 border border-amber-200';
      default: return 'text-slate-500 bg-slate-50 border border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
        <p className="text-sm text-slate-500" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Analyzing empty slots...
        </p>
      </div>
    );
  }

  const totalPotentialRevenue = suggestions.filter(s => !publishedIds.has(s.id)).reduce((sum, s) => sum + s.estimatedRevenue, 0);

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-slate-900">
            Smart Fill
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white tracking-wide">
            AI
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Auto-generated events to fill empty court time
        </p>
      </div>

      {/* Revenue Opportunity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-green-700 to-emerald-700 rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-green-100 text-xs font-medium">Untapped Weekly Revenue</p>
            <p className="text-2xl font-bold text-white mt-0.5">${Math.round(totalPotentialRevenue).toLocaleString()}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-green-100 text-xs font-medium">{suggestions.length - publishedIds.size} suggestions</p>
            <p className="text-white text-sm font-semibold mt-0.5">{publishedIds.size} published</p>
          </div>
        </div>
      </motion.div>

      {/* Suggestions Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      >
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion) => {
            const typeConfig = getTypeConfig(suggestion.type);
            const isPublished = publishedIds.has(suggestion.id);
            const isPublishing = publishing === suggestion.id;

            return (
              <motion.div
                key={suggestion.id}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.35 }}
                layout
                className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                  isPublished
                    ? 'border-green-200/60 bg-green-50/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                    : 'border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-green-200/60'
                }`}
              >
                <div className="p-6">
                  {/* Type + Confidence */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${typeConfig.color}`}>
                      {typeConfig.icon}
                      <span className="text-[10px] font-bold">{typeConfig.label}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${getConfidenceColor(suggestion.confidence)}`}>
                      {suggestion.confidence.toUpperCase()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                    {suggestion.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{suggestion.description}</p>

                  {/* Time */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {suggestion.day}s
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatHour(suggestion.hour)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">~{suggestion.estimatedPlayers} players</span>
                      <span className="text-xs font-semibold text-green-700">${Math.round(suggestion.estimatedRevenue).toLocaleString()}/week</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-5">
                    {isPublished ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Published</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePublish(suggestion)}
                        disabled={isPublishing}
                        className="w-full py-2.5 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-xl transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        {isPublishing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            Publish Event
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {suggestions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">All court time is well-utilized!</p>
          <p className="text-xs text-slate-400 mt-1.5">No empty slots detected that need filling</p>
        </motion.div>
      )}
    </div>
  );
}
