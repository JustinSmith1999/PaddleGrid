import { useEffect, useMemo, useState } from 'react';
import { Video, Loader2, Clock, CalendarDays, CheckCircle2, VideoOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProBadge from './social/ProBadge';

interface Session {
  id: string;
  topic: string | null;
  scheduled_at: string;
  duration_min: number;
  price_cents: number;
  status: 'open' | 'booked' | 'completed' | 'cancelled';
  meeting_url: string | null;
  pro: { id: string; full_name: string; profile_picture_url: string | null; pro_specialties: string[] | null };
}

type Bucket = 'today' | 'tomorrow' | 'this_week' | 'later';

const BUCKETS: { id: Bucket; label: string }[] = [
  { id: 'today',     label: 'Today' },
  { id: 'tomorrow',  label: 'Tomorrow' },
  { id: 'this_week', label: 'This week' },
  { id: 'later',     label: 'Later' },
];

/**
 * Virtual coaching — sky-themed page that groups upcoming sessions by
 * Today / Tomorrow / This week / Later, with a live "starts in N min" pill
 * for sessions inside the next hour.
 */
export default function VirtualCoachingPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('virtual_coaching_sessions')
      .select('id, topic, scheduled_at, duration_min, price_cents, status, meeting_url, pro:profiles!virtual_coaching_sessions_pro_id_fkey(id, full_name, profile_picture_url, pro_specialties)')
      .in('status', ['open', 'booked'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(40);
    setSessions((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const book = async (s: Session) => {
    if (!user) return;
    setBooking(s.id);
    const { error } = await supabase
      .from('virtual_coaching_sessions')
      .update({ learner_id: user.id, status: 'booked' })
      .eq('id', s.id)
      .eq('status', 'open');
    setBooking(null);
    if (!error) await load();
  };

  const grouped = useMemo(() => groupByDay(sessions), [sessions]);

  return (
    <div>
      {/* Sky hero */}
      <div className="relative overflow-hidden border-b border-sky-100/60">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/80 to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.35),transparent_55%)]" />
        <div className="relative px-5 sm:px-6 pt-7 pb-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 backdrop-blur-sm ring-1 ring-sky-200 mb-3">
            <Video className="w-3 h-3 text-sky-700" />
            <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-sky-900">Virtual coaching</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Strategy on demand.</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md leading-relaxed">30 to 60-minute video sessions with Pros. Match review, mental game, tactics, drills. Book from anywhere.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
        {loading ? <CoachingSkeleton /> : sessions.length === 0 ? <EmptyCoaching /> : (
          <div className="space-y-7">
            {BUCKETS.map(b => {
              const list = grouped[b.id];
              if (!list || list.length === 0) return null;
              return (
                <section key={b.id}>
                  <h2 className="text-[11px] uppercase tracking-[0.22em] font-extrabold text-slate-500 mb-3 px-1 flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
                    {b.label}
                    <span className="text-slate-300 font-normal tracking-normal">·</span>
                    <span className="text-slate-400 font-bold tracking-normal">{list.length}</span>
                  </h2>
                  <div className="space-y-2.5">
                    {list.map((s, i) => <SessionCard key={s.id} s={s} delay={i * 0.03} booking={booking === s.id} onBook={() => book(s)} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ s, delay, booking, onBook }: { s: Session; delay: number; booking: boolean; onBook: () => void }) {
  const startsInMin = Math.round((new Date(s.scheduled_at).getTime() - Date.now()) / 60_000);
  const startingSoon = startsInMin > 0 && startsInMin <= 60;

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`group rounded-2xl border bg-white p-4 sm:p-5 transition hover:-translate-y-px hover:shadow-[0_10px_28px_rgba(2,132,199,0.08)] ${startingSoon ? 'border-sky-300/60 ring-1 ring-sky-200/60 bg-gradient-to-br from-sky-50/40 to-white' : 'border-slate-200/70 hover:border-sky-200'}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex-shrink-0">
          {s.pro.profile_picture_url ? <img src={s.pro.profile_picture_url} alt={s.pro.full_name} className="w-full h-full object-cover" /> :
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-bold">{s.pro.full_name?.[0] || '?'}</div>}
          {startingSoon && <span className="absolute -inset-px rounded-full ring-2 ring-sky-400/70 animate-pulse" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-slate-900 truncate">{s.pro.full_name}</p>
            <ProBadge isPro={true} />
          </div>
          <p className="text-[15px] font-semibold text-slate-900 mt-1 leading-snug" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>{s.topic || 'Open coaching session'}</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtTime(s.scheduled_at)}</span>
            <span>·</span>
            <span>{s.duration_min} min</span>
            {startingSoon && <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-md bg-sky-100 text-sky-800 font-bold tracking-wide">Starts in {startsInMin}m</span>
            </>}
          </div>
        </div>
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
          <p className="text-lg font-bold text-emerald-900 leading-none">${(s.price_cents / 100).toFixed(0)}</p>
          {s.status === 'booked' && s.meeting_url ? (
            <a href={s.meeting_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition">
              <CheckCircle2 className="w-3 h-3" /> Join
            </a>
          ) : (
            <button onClick={onBook} disabled={booking || s.status !== 'open'}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold disabled:opacity-50 transition active:scale-[0.97]">
              {booking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Video className="w-3 h-3" />}
              Book
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function EmptyCoaching() {
  return (
    <div className="rounded-3xl border border-sky-100/60 bg-gradient-to-br from-sky-50/40 to-white p-12 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sky-100 ring-1 ring-sky-200/50 mb-3">
        <VideoOff className="w-7 h-7 text-sky-700" />
      </div>
      <p className="text-base font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>No open sessions right now</p>
      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Pros add new slots daily. Follow a Pro to get notified when they open up new times.</p>
    </div>
  );
}

function CoachingSkeleton() {
  return (
    <div className="space-y-7">
      {['Today', 'This week'].map((label, gi) => (
        <section key={label}>
          <div className="h-3 w-24 bg-sky-100 rounded-full mb-3 animate-pulse" />
          <div className="space-y-2.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-4 sm:p-5">
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-slate-100 rounded-full animate-pulse" />
                    <div className="h-4 w-2/3 bg-slate-100 rounded-full animate-pulse" />
                    <div className="h-2.5 w-1/2 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-5 w-10 bg-emerald-50 rounded-full animate-pulse" />
                    <div className="h-7 w-14 bg-emerald-100 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByDay(sessions: Session[]): Record<Bucket, Session[]> {
  const out: Record<Bucket, Session[]> = { today: [], tomorrow: [], this_week: [], later: [] };
  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday); startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfter = new Date(startOfTomorrow); startOfDayAfter.setDate(startOfDayAfter.getDate() + 1);
  const startOfNextWeek = new Date(startOfToday); startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

  for (const s of sessions) {
    const d = new Date(s.scheduled_at);
    if (d < startOfTomorrow) out.today.push(s);
    else if (d < startOfDayAfter) out.tomorrow.push(s);
    else if (d < startOfNextWeek) out.this_week.push(s);
    else out.later.push(s);
  }
  return out;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
