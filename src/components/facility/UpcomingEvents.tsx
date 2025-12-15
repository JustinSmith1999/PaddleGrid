import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  occurrence_date: string;
  start_time: string;
  end_time: string;
  event_series: {
    id: string;
    title: string;
    description: string;
    max_participants: number;
  };
  registrations: { count: number }[];
}

interface UpcomingEventsProps {
  facilityId: string;
  onViewAll: () => void;
}

export function UpcomingEvents({ facilityId, onViewAll }: UpcomingEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadUpcomingEvents();
  }, [facilityId]);

  const loadUpcomingEvents = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('event_series_occurrences')
      .select(`
        id,
        occurrence_date,
        start_time,
        end_time,
        event_series!inner(
          id,
          title,
          description,
          max_participants,
          facility_id
        ),
        registrations:series_registrations(count)
      `)
      .eq('event_series.facility_id', facilityId)
      .eq('status', 'scheduled')
      .gte('occurrence_date', today)
      .order('occurrence_date')
      .order('start_time')
      .limit(5);

    if (data) {
      setEvents(data as any);
    }
  };

  if (events.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const getTimeUntil = (dateStr: string, timeStr: string) => {
    const eventDate = new Date(`${dateStr}T${timeStr}`);
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `in ${diffDays}d`;
    if (diffHours > 0) return `in ${diffHours}h`;
    return 'Soon';
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Events</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Don't miss out!</p>
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {events.map((event) => {
          const registrationCount = event.registrations[0]?.count || 0;
          const spotsLeft = event.event_series.max_participants - registrationCount;
          const isFilling = spotsLeft <= event.event_series.max_participants * 0.3;

          return (
            <div
              key={event.id}
              className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex flex-col items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    <p className="text-xs font-medium uppercase">
                      {new Date(event.occurrence_date).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-xl font-bold leading-none">
                      {new Date(event.occurrence_date).getDate()}
                    </p>
                  </div>
                  <div className="mt-2 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {getTimeUntil(event.occurrence_date, event.start_time)}
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 line-clamp-1">
                    {event.event_series.title}
                  </h3>
                  {event.event_series.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                      {event.event_series.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1.5 font-semibold ${
                      isFilling
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      <Users className="w-4 h-4" />
                      <span>
                        {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
