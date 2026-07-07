/**
 * Admin: pin/unpin streams from the /pro-live hero. Pinned streams show first.
 * Also surfaces a "kill switch" — end any live stream as a moderator.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pin, PinOff, Radio, Eye, Heart, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SessionRow {
  id: string;
  title: string;
  pro_id: string;
  is_live: boolean;
  is_pinned: boolean;
  viewer_count_peak: number;
  like_count: number;
  started_at: string | null;
  pro?: { id: string; full_name: string; profile_picture_url: string | null };
}

export default function AdminProLive() {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pro_live_sessions')
      .select('id, title, pro_id, is_live, is_pinned, viewer_count_peak, like_count, started_at')
      .order('started_at', { ascending: false, nullsFirst: false })
      .limit(50);
    const proIds = Array.from(new Set((data || []).map((s) => s.pro_id).filter(Boolean)));
    const profMap = new Map<string, any>();
    if (proIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url')
        .in('id', proIds);
      for (const p of profs || []) profMap.set(p.id, p);
    }
    setRows(((data as any[]) || []).map((s) => ({ ...s, pro: profMap.get(s.pro_id) })));
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const pin = async (id: string, currentlyPinned: boolean) => {
    await supabase.from('pro_live_sessions').update({
      is_pinned: !currentlyPinned,
      pinned_at: !currentlyPinned ? new Date().toISOString() : null,
    }).eq('id', id);
    await load();
  };

  const kill = async (id: string) => {
    if (!confirm('End this stream? Viewers will be disconnected.')) return;
    await supabase.from('pro_live_sessions').update({
      is_live: false,
      ended_at: new Date().toISOString(),
    }).eq('id', id);
    await load();
  };

  const live = rows.filter((r) => r.is_live);
  const recent = rows.filter((r) => !r.is_live);

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-emerald-700 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Pro Live</h1>
        <p className="text-sm text-slate-500 mt-1">Pin streams to the hero. Kill abusive streams from here.</p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-extrabold tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" /> LIVE NOW
          </span>
          <span className="text-xs text-slate-500">{live.length} streaming</span>
        </div>
        {live.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No active streams.</p>
        ) : (
          <div className="space-y-2">
            {live.map((s) => (
              <SessionCard key={s.id} s={s} onPin={pin} onKill={kill} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Recent streams</h2>
        <div className="space-y-2">
          {recent.slice(0, 20).map((s) => (
            <SessionCard key={s.id} s={s} onPin={pin} onKill={kill} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SessionCard({ s, onPin, onKill }: { s: SessionRow; onPin: (id: string, p: boolean) => void; onKill: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center gap-3"
    >
      <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
        {s.pro?.profile_picture_url
          ? <img src={s.pro.profile_picture_url} alt={s.pro.full_name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-800">{s.pro?.full_name?.[0] || '?'}</div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900 truncate">{s.pro?.full_name || 'Unknown'}</p>
          {s.is_live && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-extrabold tracking-wider">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" /> LIVE
            </span>
          )}
          {s.is_pinned && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold tracking-wider">
              <Pin className="w-2 h-2" /> PINNED
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">{s.title}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{s.viewer_count_peak}</span>
          <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" />{s.like_count}</span>
          <span className="inline-flex items-center gap-1"><Radio className="w-3 h-3" />{s.started_at ? new Date(s.started_at).toLocaleDateString() : '—'}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPin(s.id, s.is_pinned)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition ${s.is_pinned ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          aria-label={s.is_pinned ? 'Unpin' : 'Pin'}
          title={s.is_pinned ? 'Unpin' : 'Pin to hero'}
        >
          {s.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>
        {s.is_live && (
          <button
            onClick={() => onKill(s.id)}
            className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 flex items-center justify-center transition"
            aria-label="End stream"
            title="End stream"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
