import { useState, useEffect } from 'react';
import { Zap, Calendar, Clock, Users, CheckCircle, X, ArrowRight, Loader2, Sparkles, Target, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

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

      const { data: bookings } = await supabase
        .from('court_availability_blocks')
        .select('block_date, start_time, court_id, courts(name)')
        .eq('block_type', 'reservation')
        .gte('block_date', thirtyDaysAgo.toISOString().split('T')[0]);

      const { data: courts } = await supabase.from('courts').select('id, name, hourly_rate');

      const totalCourts = courts?.length || 4;

      // Build heatmap
      const heatmap: Record<string, Record<number, number>> = {};
      DAYS.forEach(day => { heatmap[day] = {}; });

      bookings?.forEach(b => {
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
      case 'open-play': return { color: 'bg-green-50 text-green-600', icon: <Users className="w-4 h-4" />, label: 'Open Play' };
      case 'drop-in': return { color: 'bg-sky-50 text-sky-600', icon: <Zap className="w-4 h-4" />, label: 'Drop-In' };
      case 'clinic': return { color: 'bg-amber-50 text-amber-600', icon: <Target className="w-4 h-4" />, label: 'Clinic' };
      case 'social': return { color: 'bg-violet-50 text-violet-600', icon: <Sparkles className="w-4 h-4" />, label: 'Social' };
      default: return { color: 'bg-slate-50 text-slate-600', icon: <Calendar className="w-4 h-4" />, label: 'Event' };
    }
  };

  const getConfidenceColor = (c: string) => {
    switch (c) {
      case 'high': return 'text-green-700 bg-green-50';
      case 'medium': return 'text-amber-700 bg-amber-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
        <p className="text-sm text-slate-500">Analyzing empty slots...</p>
      </div>
    );
  }

  const totalPotentialRevenue = suggestions.filter(s => !publishedIds.has(s.id)).reduce((sum, s) => sum + s.estimatedRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Smart Fill
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white">AI</span>
        </div>
        <p className="text-slate-500 text-sm mt-0.5">
          Auto-generated events to fill empty court time
        </p>
      </div>

      {/* Revenue Opportunity */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-700 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-green-100 text-xs font-medium">Untapped Weekly Revenue</p>
            <p className="text-2xl font-bold text-white">${totalPotentialRevenue.toFixed(0)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-green-100 text-xs">{suggestions.length - publishedIds.size} suggestions</p>
            <p className="text-white text-sm font-medium">{publishedIds.size} published</p>
          </div>
        </div>
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion, index) => {
            const typeConfig = getTypeConfig(suggestion.type);
            const isPublished = publishedIds.has(suggestion.id);
            const isPublishing = publishing === suggestion.id;

            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
                layout
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isPublished ? 'border-green-200 bg-green-50/30' : 'border-slate-100 hover:shadow-md hover:border-green-100'
                }`}
              >
                <div className="p-5">
                  {/* Type + Confidence */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${typeConfig.color}`}>
                      {typeConfig.icon}
                      <span className="text-[10px] font-bold">{typeConfig.label}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getConfidenceColor(suggestion.confidence)}`}>
                      {suggestion.confidence.toUpperCase()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{suggestion.title}</h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{suggestion.description}</p>

                  {/* Time */}
                  <div className="flex items-center gap-3 mb-4">
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
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">~{suggestion.estimatedPlayers} players</span>
                      <span className="text-xs font-semibold text-green-700">${suggestion.estimatedRevenue.toFixed(0)}/week</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-4">
                    {isPublished ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Published</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePublish(suggestion)}
                        disabled={isPublishing}
                        className="w-full py-2 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
      </div>

      {suggestions.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">All court time is well-utilized!</p>
          <p className="text-xs text-slate-400 mt-1">No empty slots detected that need filling</p>
        </div>
      )}
    </div>
  );
}
