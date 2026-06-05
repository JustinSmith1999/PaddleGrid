import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Loader2, Calendar, Users2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Row {
  id: string;
  title: string | null;
  runs_open_play: boolean;
  runs_events: boolean;
  roles: string[];
  facilities: { id: string; name: string; slug: string; logo_url: string | null };
  profiles: { id: string; full_name: string; profile_picture_url: string | null };
}

/**
 * Browse all PaddleGrid Ambassadors across the network.
 * Shows who they rep + what they do (open play, events).
 */
export default function AmbassadorsDirectory({ onOpenProfile, onOpenClub }: { onOpenProfile?: (id: string) => void; onOpenClub?: (slug: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('ambassadors')
        .select(`
          id, title, runs_open_play, runs_events, roles,
          facilities!ambassadors_facility_id_fkey(id, name, slug, logo_url),
          profiles!ambassadors_pro_id_fkey(id, full_name, profile_picture_url)
        `)
        .eq('status', 'active')
        .order('display_order', { ascending: true })
        .limit(100);
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Ambassadors</h1>
        <p className="text-xs text-slate-500 mt-1">Coaches and community leaders affiliated with PaddleGrid facilities. Many run open play or help organize events.</p>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="rounded-2xl border border-slate-200/70 bg-white p-4 flex items-center gap-3">
              <button onClick={() => onOpenProfile?.(r.profiles.id)} className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex-shrink-0">
                {r.profiles.profile_picture_url
                  ? <img src={r.profiles.profile_picture_url} alt={r.profiles.full_name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-bold">{r.profiles.full_name?.[0]?.toUpperCase() || '?'}</div>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onOpenProfile?.(r.profiles.id)} className="text-sm font-bold text-slate-900 truncate hover:text-emerald-800">{r.profiles.full_name}</button>
                  <span className="inline-flex items-center px-1.5 py-px rounded-md bg-amber-100 text-amber-900 text-[9px] font-extrabold uppercase tracking-wider"><Award className="w-2.5 h-2.5 mr-0.5" /> Ambassador</span>
                </div>
                {r.title && <p className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wide mt-0.5">{r.title}</p>}
                <button onClick={() => onOpenClub?.(r.facilities.slug)} className="text-[11px] text-slate-500 mt-0.5 hover:text-emerald-700">at {r.facilities.name}</button>
                {(r.runs_open_play || r.runs_events) && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {r.runs_open_play && <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-bold"><Users2 className="w-2.5 h-2.5" /> Open play captain</span>}
                    {r.runs_events  && <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-md bg-sky-50 text-sky-800 text-[9px] font-bold"><Calendar className="w-2.5 h-2.5" /> Event organizer</span>}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
