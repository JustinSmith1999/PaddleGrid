import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, DollarSign, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { autoSyncEventsIfNeeded } from '../lib/autoSyncEvents';

interface EventCalendarProps {
  facilityId: string;
  onEventClick?: (eventId: string) => void;
}

interface EventOccurrence {
  id: string;
  occurrence_date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_registrants: number;
  status: string;
  event_series: {
    id: string;
    title: string;
    description: string;
    price_per_session: number;
    event_type: string;
    category?: {
      id: string;
      name: string;
      slug: string;
      color: string;
      icon: string;
    };
  };
}

export default function EventCalendar({ facilityId, onEventClick }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [visibleEventsCount, setVisibleEventsCount] = useState(3);

  useEffect(() => {
    autoSyncEventsIfNeeded();
    loadData();
    setVisibleEventsCount(3);
  }, [facilityId, currentDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      const { data: eventsData, error: eventsError } = await supabase
        .from('event_series_occurrences')
        .select(`
          id,
          occurrence_date,
          start_time,
          end_time,
          max_participants,
          current_registrants,
          status,
          event_series!inner(
            id,
            title,
            description,
            price_per_session,
            event_type,
            facility_id,
            category_id,
            category:event_categories!inner(
              id,
              name,
              slug,
              color,
              icon
            )
          )
        `)
        .eq('event_series.facility_id', facilityId)
        .eq('event_series.category.slug', 'open-play')
        .gte('occurrence_date', startDate)
        .lte('occurrence_date', endDate)
        .eq('status', 'scheduled')
        .order('occurrence_date')
        .order('start_time');

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      }

      const formattedEvents = (eventsData || []).map((e: any) => ({
        id: e.id,
        occurrence_date: e.occurrence_date,
        start_time: e.start_time,
        end_time: e.end_time,
        max_participants: e.max_participants,
        current_registrants: e.current_registrants,
        status: e.status,
        event_series: {
          id: e.event_series.id,
          title: e.event_series.title,
          description: e.event_series.description,
          price_per_session: e.event_series.price_per_session,
          event_type: e.event_series.event_type,
          category: e.event_series.category
        }
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.occurrence_date === dateStr);
  };

  const renderCalendarView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50 rounded-xl" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className={`h-24 p-2 rounded-xl border transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] ${
            isToday
              ? 'border-green-300 bg-green-50/50 ring-1 ring-green-200'
              : 'border-slate-200/60 bg-white hover:border-slate-300'
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-green-700' : 'text-slate-500'}`}>
            {day}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            {dayEvents.slice(0, 2).map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick?.(event.event_series.id)}
                className="w-full text-left text-[10px] truncate px-1.5 py-0.5 rounded-md font-medium transition-colors hover:opacity-80"
                style={{ backgroundColor: (event.event_series.category?.color || '#15803d') + '15', color: event.event_series.category?.color || '#15803d' }}
              >
                {formatTime(event.start_time)} {event.event_series.title}
              </button>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-[9px] text-slate-400 px-1 font-medium">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const groupEventsByDate = () => {
    const grouped: { [date: string]: EventOccurrence[] } = {};
    events.forEach(event => {
      if (!grouped[event.occurrence_date]) {
        grouped[event.occurrence_date] = [];
      }
      grouped[event.occurrence_date].push(event);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  return (
    <div className="space-y-5">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 border border-transparent hover:border-slate-200"
          >
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <h3
            className="text-lg font-bold text-slate-800 min-w-[180px] text-center"
          >
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 border border-transparent hover:border-slate-200"
          >
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <button
          onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
          className="px-4 py-2 text-sm rounded-xl bg-slate-50/80 border border-slate-200/60 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 font-medium"
        >
          {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-green-700/20 border-t-green-700 rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No events scheduled for this month</p>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {renderCalendarView()}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {events.slice(0, visibleEventsCount).map((event, index) => (
              <motion.button
                key={event.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
                onClick={() => onEventClick?.(event.event_series.id)}
                className="w-full bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 text-left group"
              >
                <div className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                    style={{ backgroundColor: event.event_series.category?.color || '#15803d' }}
                  >
                    {formatTime(event.start_time).split(':')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400 mb-1 font-medium">
                      {new Date(event.occurrence_date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <h4
                      className="font-semibold text-slate-800 mb-1.5 text-sm group-hover:text-green-700 transition-colors"
                    >
                      {event.event_series.title}
                    </h4>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-1">
                      {event.event_series.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>{event.current_registrants}/{event.max_participants}</span>
                      </div>
                      {event.event_series.price_per_session > 0 && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-semibold text-xs">
                          ${event.event_series.price_per_session}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          {events.length > visibleEventsCount && (
            <button
              onClick={() => setVisibleEventsCount(prev => Math.min(prev + 3, events.length))}
              className="w-full px-4 py-3 bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-slate-600 rounded-2xl font-semibold text-sm hover:border-green-300 hover:text-green-700 hover:bg-green-50/50 transition-all duration-200"
            >
              Show More Events ({Math.min(3, events.length - visibleEventsCount)} more)
            </button>
          )}
        </>
      )}
    </div>
  );
}
