import React, { useState, useEffect } from 'react';
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
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 dark:bg-slate-800/50 rounded-lg" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className={`h-24 p-2 rounded-lg border ${
            isToday
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}>
            {day}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            {dayEvents.slice(0, 2).map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick?.(event.event_series.id)}
                className="w-full text-left text-[10px] truncate px-1 py-0.5 rounded"
                style={{ backgroundColor: event.event_series.category?.color + '20', color: event.event_series.category?.color }}
              >
                {formatTime(event.start_time)} {event.event_series.title}
              </button>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-[9px] text-slate-500 dark:text-slate-400 px-1">
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {viewMode === 'calendar' ? 'List' : 'Calendar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No events scheduled for this month</p>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
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
          <div className="space-y-4">
            {events.slice(0, visibleEventsCount).map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick?.(event.event_series.id)}
                className="w-full bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all text-left"
              >
                <div className="flex gap-3">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md"
                    style={{ backgroundColor: event.event_series.category?.color || '#3B82F6' }}
                  >
                    {formatTime(event.start_time).split(':')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {new Date(event.occurrence_date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1 text-sm">
                      {event.event_series.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-1">
                      {event.event_series.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Users className="w-3 h-3" />
                        {event.current_registrants}/{event.max_participants}
                      </div>
                      {event.event_series.price_per_session > 0 && (
                        <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <DollarSign className="w-3 h-3" />
                          ${event.event_series.price_per_session}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {events.length > visibleEventsCount && (
            <button
              onClick={() => setVisibleEventsCount(prev => Math.min(prev + 3, events.length))}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition-colors"
            >
              Show More Events ({Math.min(3, events.length - visibleEventsCount)} more)
            </button>
          )}
        </>
      )}
    </div>
  );
}
