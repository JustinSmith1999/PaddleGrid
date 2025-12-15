import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HeatmapData {
  day_of_week: number;
  hour_of_day: number;
  booking_count: number;
}

interface ActivityHeatmapProps {
  facilityId: string;
}

const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = Array.from({ length: 18 }, (_, i) => i + 6);

export function ActivityHeatmap({ facilityId }: ActivityHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [maxBookings, setMaxBookings] = useState(0);

  useEffect(() => {
    loadHeatmapData();
  }, [facilityId]);

  const loadHeatmapData = async () => {
    const { data } = await supabase
      .from('facility_activity_heatmap')
      .select('*')
      .eq('facility_id', facilityId);

    if (data && data.length > 0) {
      setHeatmapData(data);
      const max = Math.max(...data.map(d => d.booking_count));
      setMaxBookings(max);
    }
  };

  if (heatmapData.length === 0) return null;

  const getBookingCount = (day: number, hour: number) => {
    const entry = heatmapData.find(d => d.day_of_week === day && d.hour_of_day === hour);
    return entry?.booking_count || 0;
  };

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
    const ratio = count / maxBookings;
    if (ratio < 0.25) return 'bg-emerald-200 dark:bg-emerald-900/40';
    if (ratio < 0.5) return 'bg-emerald-400 dark:bg-emerald-700/60';
    if (ratio < 0.75) return 'bg-emerald-600 dark:bg-emerald-600/80';
    return 'bg-emerald-700 dark:bg-emerald-500';
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  const busiestTimes = heatmapData
    .sort((a, b) => b.booking_count - a.booking_count)
    .slice(0, 3);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-md">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Activity Heatmap</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Busiest times at this facility</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {busiestTimes.map((time, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {daysShort[time.day_of_week]}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatHour(time.hour_of_day)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {time.booking_count}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-1 mb-2 ml-12">
              {hours.map(hour => (
                <div key={hour} className="w-8 text-[10px] text-center text-slate-500 dark:text-slate-400">
                  {hour === 6 || hour === 12 || hour === 18 ? formatHour(hour).split(' ')[0] : ''}
                </div>
              ))}
            </div>

            {daysShort.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-1 mb-1">
                <div className="w-10 text-xs font-medium text-slate-600 dark:text-slate-400 text-right pr-2">
                  {day}
                </div>
                {hours.map(hour => {
                  const count = getBookingCount(dayIndex, hour);
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`w-8 h-6 rounded ${getIntensityClass(count)} transition-colors hover:ring-2 hover:ring-emerald-500 cursor-pointer`}
                      title={`${day} ${formatHour(hour)}: ${count} bookings`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-600 dark:text-slate-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="w-4 h-4 rounded bg-emerald-200 dark:bg-emerald-900/40" />
            <div className="w-4 h-4 rounded bg-emerald-400 dark:bg-emerald-700/60" />
            <div className="w-4 h-4 rounded bg-emerald-600 dark:bg-emerald-600/80" />
            <div className="w-4 h-4 rounded bg-emerald-700 dark:bg-emerald-500" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
