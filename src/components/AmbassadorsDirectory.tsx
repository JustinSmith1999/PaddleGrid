import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Loader2, Calendar, Users2, Crown, ChevronRight } from 'lucide-react';
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

interface Group {
  facility: Row['facilities'];
  ambassadors: Row[];
}

/**
 * Ambassadors — amber crown theme. Grouped by facility so you see the
 * community structure, not just a flat list.
 */
export default function AmbassadorsDirectory({ onOpenProfile, onOpenClub }: { onOpenProfile?: (id: string) => void; onOpenClub?: (slug: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from('ambassadors')
        .select(`
          id, title, runs_open_play, runs_events, roles,
          facilities:facility_id(id, name, slug, logo_url),
          profiles:pro_id(id, full_name, profile_picture_url)
        `)
        .eq('status', 'active')
        .order('display_order', { ascending: true })
        .limit(100);
      if (error) console.error('Ambassadors query', error);
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const r of rows) {
      if (!r.facilities) continue;
      const k = r.facilities.id;
      if (!map.has(k)) map.set(k, { facility: r.facilities, ambassadors: [] });
      map.get(k)!.ambassadors.push(r);
    }
    return Array.from(map.values());
  }, [rows]);

  return (
    <div>
      {/* Amber hero */}
      <div className="relative overflow-hidden border-b border-amber-100/60">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/80 to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_-30%,rgba(217,119,6,0.25),transparent_55%)]" />
        <div className="relative px-5 sm:px-6 pt-7 pb-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 backdrop-blur-sm ring-1 ring-amber-200 mb-3">
            <Crown className="w-3 h-3 text-amber-700" />
            <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-amber-900">Community captains</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Ambassadors</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md leading-relaxed">Coaches and leaders affiliated with PaddleGrid facilities. Many run open play sessions and help organize events for their club.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
        {loading ? <AmbassadorsSkeleton /> : groups.length === 0 ? <EmptyAmbassadors /> : (
          <div className="space-y-6">
            {groups.map((g, gi) => (
              <FacilityGroup key={g.facility.id} g={g} delay={gi * 0.05} onOpenProfile={onOpenProfile} onOpenClub={onOpenClub} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FacilityGroup({ g, delay, onOpenProfile, onOpenClub }: { g: Group; delay: number; onOpenProfile?: (id: string) => void; onOpenClub?: (slug: string) => void }) {
  return (
    <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <button
        onClick={() => onOpenClub?.(g.facility.slug)}
        className="group w-full flex items-center gap-2.5 mb-2 px-1 hover:opacity-90 transition"
      >
        <div className="w-7 h-7 rounded-lg overflow-hidden bg-amber-50 ring-1 ring-amber-200/60 flex items-center justify-center flex-shrink-0">
          {g.facility.logo_url ? <img src={g.facility.logo_url} alt={g.facility.name} className="w-full h-full object-cover" /> : <Award className="w-3.5 h-3.5 text-amber-700" />}
        </div>
        <h2 className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>{g.facility.name}</h2>
        <span className="text-[11px] text-slate-400 font-bold ml-1">·</span>
        <span className="text-[11px] text-slate-500 font-bold">{g.ambassadors.length} ambassador{g.ambassadors.length === 1 ? '' : 's'}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-700 ml-auto transition-colors" />
      </button>

      <div className="space-y-2">
        {g.ambassadors.map((r, i) => <AmbCard key={r.id} r={r} delay={i * 0.02} onOpenProfile={onOpenProfile} />)}
      </div>
    </motion.section>
  );
}

function AmbCard({ r, delay, onOpenProfile }: { r: Row; delay: number; onOpenProfile?: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="group rounded-2xl border border-slate-200/70 bg-white p-3.5 flex items-center gap-3 hover:border-amber-200 hover:shadow-[0_8px_22px_rgba(217,119,6,0.06)] transition active:scale-[0.997]"
    >
      <button onClick={() => onOpenProfile?.(r.profiles.id)} className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 ring-2 ring-amber-200/60 flex-shrink-0">
        {r.profiles.profile_picture_url
          ? <img src={r.profiles.profile_picture_url} alt={r.profiles.full_name} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-bold">{r.profiles.full_name?.[0]?.toUpperCase() || '?'}</div>}
        <Crown className="absolute -top-1.5 -right-1.5 w-4 h-4 text-amber-500 fill-amber-300 drop-shadow-sm" />
      </button>
      <div className="flex-1 min-w-0">
        <button onClick={() => onOpenProfile?.(r.profiles.id)} className="text-sm font-bold text-slate-900 truncate hover:text-amber-800 transition-colors">{r.profiles.full_name}</button>
        {r.title && <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wide mt-px">{r.title}</p>}
        {(r.runs_open_play || r.runs_events) && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {r.runs_open_play && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold"><Users2 className="w-2.5 h-2.5" /> Open play</span>}
            {r.runs_events    && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-800 text-[10px] font-bold"><Calendar className="w-2.5 h-2.5" /> Events</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyAmbassadors() {
  return (
    <div className="rounded-3xl border border-amber-100/60 bg-gradient-to-br from-amber-50/40 to-white p-12 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 ring-1 ring-amber-200/50 mb-3">
        <Crown className="w-7 h-7 text-amber-700" />
      </div>
      <p className="text-base font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Building the community</p>
      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Facilities are nominating their first ambassadors. Check back soon.</p>
    </div>
  );
}

function AmbassadorsSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1].map(g => (
        <div key={g}>
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className="w-7 h-7 rounded-lg bg-amber-100 animate-pulse" />
            <div className="h-3 w-1/3 bg-slate-100 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl border border-slate-200/70 bg-white p-3.5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/3 bg-slate-100 rounded-full animate-pulse" />
                  <div className="h-2 w-1/2 bg-slate-100 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
