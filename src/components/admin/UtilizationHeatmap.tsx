import { useState, useEffect } from 'react';
import { Loader2, Calendar, TrendingUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, fetchAllRows } from '../../lib/supabase';

interface HeatmapCell {
  day: number;
  hour: number;
  bookings: number;
  utilization: number; // 0-1
}

interface UtilizationHeatmapProps {
  facilityId?: string | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6AM - 9PM

export default function UtilizationHeatmap({ facilityId }: UtilizationHeatmapProps) {
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCourts, setTotalCourts] = useState(4);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [avgUtilization, setAvgUtilization] = useState(0);
  const [peakSlot, setPeakSlot] = useState<{ day: string; hour: string; util: number } | null>(null);

  useEffect(() => {
    loadHeatmapData();
  }, []);

  const loadHeatmapData = async () => {
    try {
      const { data: courts } = await supabase.from('courts').select('id');
      const courtCount = courts?.length || 4;
      setTotalCourts(courtCount);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const bookings = await fetchAllRows(() =>
        supabase.from('court_availability_blocks')
          .select('block_date, start_time')
          .eq('block_type', 'reservation')
          .gte('block_date', thirtyDaysAgo.toISOString().split('T')[0])
      );

      // Build counts
      const counts: Record<string, number> = {};
      bookings.forEach(b => {
        const date = new Date(b.block_date + 'T00:00:00');
        const day = date.getDay();
        const hour = parseInt(b.start_time.split(':')[0]);
        counts[`${day}-${hour}`] = (counts[`${day}-${hour}`] || 0) + 1;
      });

      const weeksInPeriod = 4.3;
      const heatmapCells: HeatmapCell[] = [];
      let totalUtil = 0;
      let maxUtil = 0;
      let maxDay = 0;
      let maxHour = 0;

      DAYS.forEach((_, dayIndex) => {
        HOURS.forEach(hour => {
          const raw = counts[`${dayIndex}-${hour}`] || 0;
          const avgPerWeek = raw / weeksInPeriod;
          const utilization = Math.min(1, avgPerWeek / courtCount);
          heatmapCells.push({ day: dayIndex, hour, bookings: raw, utilization });
          totalUtil += utilization;

          if (utilization > maxUtil) {
            maxUtil = utilization;
            maxDay = dayIndex;
            maxHour = hour;
          }
        });
      });

      setCells(heatmapCells);
      setAvgUtilization(totalUtil / heatmapCells.length);
      if (maxUtil > 0) {
        setPeakSlot({
          day: FULL_DAYS[maxDay],
          hour: formatHour(maxHour),
          util: Math.round(maxUtil * 100),
        });
      }
    } catch (error) {
      console.error('Error loading heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}${period}`;
  };

  const getCellColor = (utilization: number) => {
    if (utilization === 0) return 'bg-slate-50';
    if (utilization < 0.15) return 'bg-green-100';
    if (utilization < 0.3) return 'bg-green-200';
    if (utilization < 0.5) return 'bg-green-300';
    if (utilization < 0.7) return 'bg-green-500';
    if (utilization < 0.85) return 'bg-green-600';
    return 'bg-green-800';
  };

  const getCellTextColor = (utilization: number) => {
    if (utilization >= 0.5) return 'text-white';
    return 'text-slate-600';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16 gap-3">
        <Loader2 className="w-6 h-6 text-green-700 animate-spin" />
        <p className="text-sm text-slate-500">Building heatmap...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Court Utilization Heatmap</h3>
          <p className="text-xs text-slate-400 mt-0.5">Last 30 days · {totalCourts} courts</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Avg Utilization</p>
            <p className="text-sm font-bold text-slate-900">{Math.round(avgUtilization * 100)}%</p>
          </div>
          {peakSlot && (
            <div className="text-right">
              <p className="text-[10px] text-slate-400">Peak</p>
              <p className="text-xs font-medium text-green-700">{peakSlot.day} {peakSlot.hour} ({peakSlot.util}%)</p>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-5 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="grid grid-cols-[50px_repeat(16,1fr)] gap-1 mb-1">
            <div />
            {HOURS.map(h => (
              <div key={h} className="text-center text-[9px] font-medium text-slate-400">
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {DAYS.map((dayLabel, dayIndex) => (
            <div key={dayLabel} className="grid grid-cols-[50px_repeat(16,1fr)] gap-1 mb-1">
              <div className="flex items-center justify-end pr-2">
                <span className="text-[11px] font-medium text-slate-500">{dayLabel}</span>
              </div>
              {HOURS.map((hour, hourIndex) => {
                const cell = cells.find(c => c.day === dayIndex && c.hour === hour);
                const utilization = cell?.utilization || 0;

                return (
                  <motion.div
                    key={`${dayIndex}-${hour}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, delay: (dayIndex * 16 + hourIndex) * 0.003 }}
                    className={`aspect-square rounded-md ${getCellColor(utilization)} ${getCellTextColor(utilization)} flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-green-400 hover:ring-offset-1 transition-all relative group`}
                    onMouseEnter={() => setHoveredCell(cell || null)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <span className="text-[8px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {Math.round(utilization * 100)}%
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
          <span className="text-[10px] text-slate-400">Less</span>
          <div className="flex gap-0.5">
            {[0, 0.15, 0.3, 0.5, 0.7, 0.85, 1].map((util, i) => (
              <div key={i} className={`w-4 h-4 rounded-sm ${getCellColor(util)}`} />
            ))}
          </div>
          <span className="text-[10px] text-slate-400">More</span>

          {hoveredCell && (
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
              <Info className="w-3 h-3 text-slate-400" />
              <span>
                {FULL_DAYS[hoveredCell.day]} {formatHour(hoveredCell.hour)}: {Math.round(hoveredCell.utilization * 100)}% utilization ({hoveredCell.bookings} bookings)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
