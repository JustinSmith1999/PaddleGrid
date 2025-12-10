import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CalendarOccurrence {
  id: string;
  occurrence_date: string;
  start_time: string;
  end_time: string;
  status: string;
  current_registrants: number;
  max_participants: number;
  event_series: {
    title: string;
    event_type: string;
  };
  courts: {
    name: string;
  };
}

interface SeriesCalendarProps {
  onOccurrenceClick: (occurrenceId: string, seriesId: string) => void;
}

export default function SeriesCalendar({ onOccurrenceClick }: SeriesCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [occurrences, setOccurrences] = useState<CalendarOccurrence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOccurrences();
  }, [currentDate]);

  async function loadOccurrences() {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const { data, error } = await supabase
        .from('event_series_occurrences')
        .select(`
          id,
          occurrence_date,
          start_time,
          end_time,
          status,
          current_registrants,
          max_participants,
          event_series!inner(id, title, event_type),
          courts(name)
        `)
        .gte('occurrence_date', startDate.toISOString().split('T')[0])
        .lte('occurrence_date', endDate.toISOString().split('T')[0])
        .neq('event_series.is_archived', true);

      if (error) throw error;

      setOccurrences(data as any || []);
    } catch (error) {
      console.error('Error loading occurrences:', error);
    } finally {
      setLoading(false);
    }
  }

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  }

  function getDaysInMonth() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }

  function getOccurrencesForDate(date: Date | null): CalendarOccurrence[] {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return occurrences.filter(occ => occ.occurrence_date === dateStr);
  }

  function getEventTypeColor(type: string): string {
    const colors: Record<string, string> = {
      open_play: 'bg-blue-500',
      clinic: 'bg-green-500',
      tournament: 'bg-purple-500',
      league: 'bg-orange-500',
      social: 'bg-pink-500'
    };
    return colors[type] || 'bg-gray-500';
  }

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading calendar...
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}

            {days.map((date, index) => {
              const dayOccurrences = getOccurrencesForDate(date);
              const isToday = date && date.toDateString() === new Date().toDateString();
              const isPast = date && date < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border border-gray-200 rounded-lg p-2 ${
                    !date
                      ? 'bg-gray-50'
                      : isPast
                      ? 'bg-gray-50'
                      : isToday
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white hover:bg-gray-50'
                  } transition`}
                >
                  {date && (
                    <>
                      <div
                        className={`text-sm font-medium mb-2 ${
                          isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayOccurrences.slice(0, 3).map(occ => (
                          <button
                            key={occ.id}
                            onClick={() => onOccurrenceClick(occ.id, (occ.event_series as any).id)}
                            className={`w-full text-left p-1 rounded text-xs ${getEventTypeColor(
                              occ.event_series.event_type
                            )} text-white hover:opacity-80 transition truncate`}
                            title={`${occ.event_series.title} - ${occ.start_time}`}
                          >
                            <div className="font-medium truncate">{occ.event_series.title}</div>
                            <div className="text-xs opacity-90">{occ.start_time.slice(0, 5)}</div>
                          </button>
                        ))}
                        {dayOccurrences.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayOccurrences.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Open Play</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Clinic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span>Tournament</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span>League</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-pink-500" />
            <span>Social</span>
          </div>
        </div>
      </div>
    </div>
  );
}
