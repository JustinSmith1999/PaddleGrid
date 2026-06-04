import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Court { id: string; name: string }
interface EventOccurrence {
  id: string;
  start_time: string;
  end_time: string;
  occurrence_date: string;
  event_series: { id: string; title: string; series_type: string | null; price_per_session: number | null } | null;
}

interface Props {
  facilityId: string;
  courts: Court[];
  onBookSlot?: (date: string, startTime: string, availableCourtIds: string[]) => void;
  onOpenEvent?: (occurrenceId: string, seriesId: string) => void;
}

type Category = 'rental' | 'open_play' | 'programming';

const HOUR_START = 7;   // 7am
const HOUR_END = 22;    // 10pm — exclusive end of last slot

function fmt12(h: number, m: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

function dateLabel(iso: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(iso + 'T00:00:00');
  const dayMs = 86400000;
  const diff = Math.round((d.getTime() - today.getTime()) / dayMs);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().substring(0, 10);
}

/**
 * PodPlay-style slot board.
 * Court Rental tab — vertical time slots, each row shows how many courts are
 *   available for a 30-min window. One tap → caller's booking flow.
 * Open Play / Programming — events from event_series_occurrences filtered by
 *   series_type.
 */
export default function SlotBoard({ facilityId, courts, onBookSlot, onOpenEvent }: Props) {
  const [category, setCategory] = useState<Category>('rental');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [blocks, setBlocks] = useState<Array<{ court_id: string; start_time: string; end_time: string }>>([]);
  const [occurrences, setOccurrences] = useState<EventOccurrence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const courtIds = courts.map(c => c.id);
      const [blocksRes, occRes] = await Promise.all([
        courtIds.length
          ? supabase
              .from('court_availability_blocks')
              .select('court_id, start_time, end_time')
              .eq('booking_date', date)
              .in('court_id', courtIds)
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from('event_series_occurrences')
          .select('id, start_time, end_time, occurrence_date, event_series!inner(id, title, series_type, price_per_session, facility_id)')
          .eq('occurrence_date', date)
          .eq('event_series.facility_id', facilityId)
          .order('start_time', { ascending: true }),
      ]);
      if (cancelled) return;
      setBlocks(blocksRes.data || []);
      setOccurrences((occRes.data as any) || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [facilityId, date, courts.length]);

  // Build 30-min slot grid + availability per slot
  const slots = useMemo(() => {
    const out: Array<{ time: string; label: string; available: number; availableCourtIds: string[] }> = [];
    for (let h = HOUR_START; h < HOUR_END; h++) {
      for (const m of [0, 30]) {
        const slotStart = h * 60 + m;
        const slotEnd = slotStart + 30;
        const occupied = new Set<string>();
        for (const b of blocks) {
          const ss = b.start_time.substring(0, 5).split(':').map(Number);
          const ee = b.end_time.substring(0, 5).split(':').map(Number);
          const bStart = ss[0] * 60 + ss[1];
          const bEnd = ee[0] * 60 + ee[1];
          if (bStart < slotEnd && bEnd > slotStart) occupied.add(b.court_id);
        }
        out.push({
          time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
          label: fmt12(h, m),
          available: courts.length - occupied.size,
          availableCourtIds: courts.filter(c => !occupied.has(c.id)).map(c => c.id),
        });
      }
    }
    return out;
  }, [blocks, courts]);

  // Today's filter: hide past slots
  const todayIso = new Date().toISOString().substring(0, 10);
  const nowMin = (() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  })();
  const visibleSlots = date === todayIso
    ? slots.filter(s => {
        const [h, m] = s.time.split(':').map(Number);
        return h * 60 + m >= nowMin - 30;
      })
    : slots;

  const filteredOccurrences = occurrences.filter(o => {
    const t = o.event_series?.series_type?.toLowerCase() || '';
    if (category === 'open_play') return /open[_ ]?play|drop[_ -]?in|social/.test(t);
    if (category === 'programming') return /clinic|lesson|tournament|league|programming|class/.test(t);
    return false;
  });

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden">
      {/* Category pill bar */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b border-slate-100/70">
        {([
          { id: 'rental',      label: 'Court Rental' },
          { id: 'open_play',   label: 'Open Play' },
          { id: 'programming', label: 'Programming' },
        ] as const).map(t => {
          const isActive = category === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setCategory(t.id)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold transition ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Date stepper */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100/70 bg-slate-50/40">
        <button
          onClick={() => setDate(addDays(date, -1))}
          className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span className="text-[15px] font-bold text-slate-900">{dateLabel(date)}</span>
          <span className="text-sm text-slate-400">
            · {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <button
          onClick={() => setDate(addDays(date, 1))}
          className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="max-h-[640px] overflow-y-auto">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-sm text-slate-400">Loading slots…</div>
        ) : category === 'rental' ? (
          visibleSlots.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm text-slate-500">No more slots today.</p>
              <button onClick={() => setDate(addDays(date, 1))} className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 mt-2">
                See tomorrow →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100/70">
              {visibleSlots.map(slot => {
                const full = slot.available === 0;
                return (
                  <li key={slot.time}>
                    <button
                      disabled={full}
                      onClick={() => onBookSlot?.(date, slot.time, slot.availableCourtIds)}
                      className={`w-full flex items-center justify-between px-4 sm:px-5 py-3.5 text-left transition ${
                        full ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-50/40 active:bg-emerald-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-[15px] font-semibold text-slate-900 tabular-nums w-[88px] flex-shrink-0">{slot.label}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          full
                            ? 'bg-slate-100 text-slate-400'
                            : slot.available > 6
                              ? 'bg-emerald-50 text-emerald-800'
                              : slot.available > 2
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-rose-50 text-rose-700'
                        }`}>
                          {full ? 'Full' : `${slot.available} court${slot.available === 1 ? '' : 's'}`}
                        </span>
                      </div>
                      {!full && (
                        <span className="text-[13px] font-bold text-emerald-700 group-hover:translate-x-0.5">
                          Book →
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        ) : (
          // Open Play / Programming
          filteredOccurrences.length === 0 ? (
            <div className="py-14 text-center px-6">
              <Sparkles className="w-7 h-7 text-emerald-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No {category === 'open_play' ? 'open play sessions' : 'programming'} scheduled.</p>
              <p className="text-xs text-slate-400 mt-1">Check back, or browse other dates.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100/70">
              {filteredOccurrences.map(o => {
                const [sh, sm] = o.start_time.substring(0, 5).split(':').map(Number);
                const [eh, em] = o.end_time.substring(0, 5).split(':').map(Number);
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => o.event_series && onOpenEvent?.(o.id, o.event_series.id)}
                      className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 text-left hover:bg-emerald-50/40 transition"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-[13px] font-semibold text-slate-700 tabular-nums w-[88px] flex-shrink-0">
                          {fmt12(sh, sm).replace(' ', '')}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[15px] font-bold text-slate-900 truncate">{o.event_series?.title ?? 'Untitled session'}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            until {fmt12(eh, em).replace(' ', '')}
                            {o.event_series?.price_per_session ? ` · $${o.event_series.price_per_session}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-emerald-700">Details →</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
