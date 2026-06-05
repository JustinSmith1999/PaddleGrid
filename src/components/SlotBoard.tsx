import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Court { id: string; name?: string }
interface BookedRange {
  booking_date: string;
  start_time: string;
  end_time: string;
  court_id: string;
}

interface Props {
  facilityId: string;
  courts: Court[];
  onBookSlot?: (date: string, startTime: string, courtIds: string[]) => void;
}

const CATEGORIES = [
  { id: 'rental',      label: 'Court Rental' },
  { id: 'open_play',   label: 'Open Play' },
  { id: 'programming', label: 'Programming' },
] as const;
type CategoryId = typeof CATEGORIES[number]['id'];

const BUCKETS = [
  { id: 'morning',   label: 'Morning',   from: 6,  to: 12 },
  { id: 'afternoon', label: 'Afternoon', from: 12, to: 17 },
  { id: 'evening',   label: 'Evening',   from: 17, to: 23 },
] as const;

const pad = (n: number) => String(n).padStart(2, '0');

function* halfHours(from: number, to: number): Generator<string> {
  for (let h = from; h < to; h++) {
    yield `${pad(h)}:00`;
    yield `${pad(h)}:30`;
  }
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${pad(m)} ${period}`;
}

function minutesFromString(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Pickleball Heaven slot picker — bucketed pill grid.
 *
 * The original SlotBoard listed every 30-minute slot in a long vertical
 * column with no density information. This version groups by time of day,
 * shows availability density via color, and lays slots out in a 4-column
 * grid so a full day fits on roughly one screen.
 *
 * Slot color:
 *   • emerald  — 70%+ courts free
 *   • amber    — 30–70% free
 *   • rose     — <30% free (almost full)
 *   • slate    — completely booked (disabled)
 */
export default function SlotBoard({ facilityId, courts, onBookSlot }: Props) {
  const [category, setCategory] = useState<CategoryId>('rental');
  const [dayOffset, setDayOffset] = useState(0);
  const [bookings, setBookings] = useState<BookedRange[]>([]);
  const [loading, setLoading] = useState(true);

  const date = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);
  const dateStr = date.toISOString().slice(0, 10);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      supabase
        .from('bookings')
        .select('booking_date, start_time, end_time, court_id')
        .eq('facility_id', facilityId)
        .eq('booking_date', dateStr)
        .neq('status', 'cancelled'),
      supabase
        .from('court_availability_blocks')
        .select('booking_date, start_time, end_time, court_id')
        .eq('booking_date', dateStr),
    ]).then(([r1, r2]) => {
      if (cancelled) return;
      const combined: BookedRange[] = [...(r1.data || []), ...(r2.data || [])] as any;
      setBookings(combined);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [facilityId, dateStr]);

  function bookedAt(timeSlot: string): Set<string> {
    const slotStart = minutesFromString(timeSlot);
    const slotEnd = slotStart + 30;
    const blocked = new Set<string>();
    for (const b of bookings) {
      const bStart = minutesFromString(b.start_time);
      const bEnd = minutesFromString(b.end_time);
      if (bStart < slotEnd && bEnd > slotStart) blocked.add(b.court_id);
    }
    return blocked;
  }

  function density(timeSlot: string): { free: number; total: number; pct: number } {
    const total = courts.length;
    const blocked = bookedAt(timeSlot);
    const free = Math.max(0, total - blocked.size);
    return { free, total, pct: total > 0 ? free / total : 0 };
  }

  function pillTheme(pct: number, disabled: boolean) {
    if (disabled) return 'bg-slate-50 text-slate-300 ring-slate-200 cursor-not-allowed';
    if (pct >= 0.7) return 'bg-emerald-50 text-emerald-900 ring-emerald-200/70 hover:bg-emerald-100 hover:ring-emerald-300';
    if (pct >= 0.3) return 'bg-amber-50 text-amber-900 ring-amber-200/70 hover:bg-amber-100 hover:ring-amber-300';
    return                 'bg-rose-50 text-rose-900 ring-rose-200/70 hover:bg-rose-100 hover:ring-rose-300';
  }

  function bookSlot(timeSlot: string) {
    const d = density(timeSlot);
    if (d.free === 0) return;
    const blocked = bookedAt(timeSlot);
    const available = courts.filter(c => !blocked.has(c.id)).map(c => c.id);
    onBookSlot?.(dateStr, timeSlot, available);
  }

  // 7-day strip for the day picker
  const daysAhead = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { offset: i, date: d };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
      {/* Category tabs */}
      <div className="flex border-b border-slate-100 px-2 pt-2">
        {CATEGORIES.map(c => {
          const active = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`relative px-3 py-2 text-[12px] font-bold uppercase tracking-wider transition ${active ? 'text-emerald-900' : 'text-slate-400 hover:text-slate-700'}`}
            >
              {c.label}
              {active && <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-emerald-800 rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* Day strip — horizontal scroll, 7 days ahead */}
      <div className="flex items-center gap-1 px-3 py-3 overflow-x-auto border-b border-slate-100">
        <button onClick={() => setDayOffset(o => Math.max(0, o - 1))} disabled={dayOffset === 0}
          aria-label="Earlier day"
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1 flex-shrink-0">
          {daysAhead.map(d => {
            const active = dayOffset === d.offset;
            const dow  = d.date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            const day  = d.date.getDate();
            const isToday = d.offset === 0;
            return (
              <button
                key={d.offset}
                onClick={() => setDayOffset(d.offset)}
                className={`flex flex-col items-center justify-center min-w-[48px] px-2 py-1.5 rounded-xl transition ${active ? 'bg-emerald-800 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <span className={`text-[10px] tracking-wider font-bold ${active ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {isToday ? 'TODAY' : dow}
                </span>
                <span className="text-base font-bold leading-none mt-1">{day}</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => setDayOffset(o => o + 1)}
          aria-label="Later day"
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-50 text-slate-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        {loading ? (
          <div className="py-14 flex items-center justify-center text-slate-400 gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading availability…
          </div>
        ) : category === 'rental' ? (
          <div className="space-y-5">
            {BUCKETS.map(b => {
              const slots = Array.from(halfHours(b.from, b.to));
              const bucketStats = slots.reduce(
                (acc, t) => {
                  const d = density(t);
                  return { free: acc.free + d.free, total: acc.total + d.total };
                },
                { free: 0, total: 0 }
              );
              const allBooked = bucketStats.free === 0;
              return (
                <section key={b.id}>
                  <div className="flex items-baseline justify-between mb-2 px-0.5">
                    <h3 className="text-[11px] uppercase tracking-[0.18em] font-extrabold text-slate-500">{b.label}</h3>
                    <span className={`text-[11px] font-semibold ${allBooked ? 'text-slate-400' : 'text-emerald-700'}`}>
                      {allBooked ? 'Fully booked' : `${bucketStats.free} court-slots free`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {slots.map(t => {
                      const d = density(t);
                      const disabled = d.free === 0;
                      return (
                        <button
                          key={t}
                          onClick={() => bookSlot(t)}
                          disabled={disabled}
                          className={`flex flex-col items-center justify-center py-2.5 rounded-xl ring-1 transition active:scale-[0.97] ${pillTheme(d.pct, disabled)}`}
                        >
                          <span className="text-[12px] sm:text-[13px] font-bold tabular-nums leading-tight whitespace-nowrap">{fmtTime(t)}</span>
                          <span className="text-[11px] opacity-80 mt-0.5 tabular-nums">{d.free}/{d.total}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {/* Legend */}
            <div className="flex items-center gap-3 pt-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
              <Dot color="bg-emerald-300" /> Wide open
              <Dot color="bg-amber-300" /> Filling up
              <Dot color="bg-rose-300" /> Almost full
              <Dot color="bg-slate-300" /> Booked
            </div>
          </div>
        ) : category === 'open_play' ? (
          <EmptyMode label="No open play sessions today" sub="Check the events calendar for the weekly schedule." />
        ) : (
          <EmptyMode label="No clinics or programs today" sub="Programming includes lessons, clinics, and member-only events." />
        )}
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1`} />;
}

function EmptyMode({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{sub}</p>
    </div>
  );
}
