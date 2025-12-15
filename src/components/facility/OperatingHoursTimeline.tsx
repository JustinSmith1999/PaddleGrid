import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DayHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_peak_hours: boolean;
}

interface OperatingHoursTimelineProps {
  facilityId: string;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function OperatingHoursTimeline({ facilityId }: OperatingHoursTimelineProps) {
  const [hours, setHours] = useState<DayHours[]>([]);
  const [currentDay, setCurrentDay] = useState(new Date().getDay());

  useEffect(() => {
    loadOperatingHours();
  }, [facilityId]);

  const loadOperatingHours = async () => {
    const { data } = await supabase
      .from('facility_operating_hours')
      .select('*')
      .eq('facility_id', facilityId)
      .order('day_of_week');

    if (data && data.length > 0) {
      setHours(data);
    }
  };

  if (hours.length === 0) return null;

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalMinutes = currentHour * 60 + currentMinute;
    return (totalMinutes / (24 * 60)) * 100;
  };

  const todayHours = hours.find(h => h.day_of_week === currentDay);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Operating Hours</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Weekly schedule</p>
        </div>
      </div>

      {todayHours && (
        <div className="mb-4 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">Open Today</p>
                <p className="text-lg font-bold">
                  {formatTime(todayHours.open_time)} - {formatTime(todayHours.close_time)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-white/80 uppercase tracking-wide">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="font-bold">Open Now</span>
              </div>
            </div>
          </div>

          <div className="mt-4 relative">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${getCurrentTimePosition()}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/70">
              <span>Opening</span>
              <span>Closing</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {daysOfWeek.map((day, index) => {
          const dayHours = hours.find(h => h.day_of_week === index);
          const isToday = index === currentDay;

          return (
            <div
              key={day}
              className={`flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${
                isToday ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {isToday && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <div>
                  <p className={`font-bold ${
                    isToday
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {day}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{dayAbbr[index]}</p>
                </div>
              </div>

              {dayHours ? (
                <div className="flex items-center gap-3">
                  {dayHours.is_peak_hours && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                      <Sun className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Peak</span>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatTime(dayHours.open_time)} - {formatTime(dayHours.close_time)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Moon className="w-4 h-4" />
                  <span className="font-medium">Closed</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
