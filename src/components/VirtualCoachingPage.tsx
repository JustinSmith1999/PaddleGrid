import { useEffect, useState } from 'react';
import { Video, Loader2, Clock, Trophy } from 'lucide-react';
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

/**
 * Virtual coaching — Pros offer 30/60-min video sessions. People book them
 * like a court slot; meeting_url opens the Zoom/Daily room.
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
      .in('status', ['open','booked'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(30);
    setSessions((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const book = async (s: Session) => {
    if (!user) return;
    setBooking(s.id);
    const { error } = await supabase.from('virtual_coaching_sessions').update({ learner_id: user.id, status: 'booked' }).eq('id', s.id).eq('status', 'open');
    setBooking(null);
    if (!error) await load();
  };

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-sky-50 text-sky-800 text-[10px] font-extrabold uppercase tracking-wider mb-2">
          <Video className="w-3 h-3" /> Virtual
        </div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Coaching sessions</h1>
        <p className="text-xs text-slate-500 mt-1">Book a video session with a Pro. Strategy talks, match review, mental game.</p>
      </div>

      {loading ? <div className="py-12 flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div> : sessions.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-10">No open sessions right now. Check back tomorrow — Pros add slots daily.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex-shrink-0">
                {s.pro.profile_picture_url ? <img src={s.pro.profile_picture_url} alt={s.pro.full_name} className="w-full h-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-900 truncate">{s.pro.full_name}</p>
                  <ProBadge isPro={true} />
                </div>
                <p className="text-xs text-slate-700 font-semibold mt-0.5">{s.topic || 'Open coaching session'}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(s.scheduled_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  <span>·</span>
                  <span>{s.duration_min} min</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-emerald-900">${(s.price_cents/100).toFixed(0)}</p>
                {s.status === 'booked' && s.meeting_url
                  ? <a href={s.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 px-3 py-1.5 rounded-xl bg-sky-600 text-white text-[11px] font-bold">Join</a>
                  : <button onClick={() => book(s)} disabled={booking === s.id || s.status !== 'open'}
                      className="inline-flex items-center gap-1 mt-1 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold disabled:opacity-50">
                      {booking === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trophy className="w-3 h-3" />}
                      Book
                    </button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
