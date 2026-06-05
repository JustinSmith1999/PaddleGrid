import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Loader2, Search, Star, Sparkles, UserX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProBadge from './social/ProBadge';

interface Pro {
  id: string;
  full_name: string;
  profile_picture_url: string | null;
  pro_bio: string | null;
  pro_specialties: string[] | null;
  pro_hourly_rate: number | null;
}

const SPECIALTY_FILTERS = ['All', 'Open Play', 'Skill Up', 'Strategy', 'Doubles', 'Backhand'];

/**
 * Pros directory — gold-accented hero, Featured carousel, then full grid.
 */
export default function ProsDirectory({ onOpenProfile }: { onOpenProfile?: (id: string) => void }) {
  const [pros, setPros] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<string>('All');

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url, pro_bio, pro_specialties, pro_hourly_rate')
        .eq('is_pro', true)
        .order('pro_hourly_rate', { ascending: false, nullsFirst: false })
        .limit(100);
      if (error) console.error('Pros query', error);
      setPros((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(() => pros.filter(p => {
    if (chip !== 'All' && !(p.pro_specialties || []).some(s => s.toLowerCase().includes(chip.toLowerCase()))) return false;
    if (!q) return true;
    const ql = q.toLowerCase();
    return p.full_name.toLowerCase().includes(ql) || (p.pro_specialties || []).some(s => s.toLowerCase().includes(ql));
  }), [pros, chip, q]);

  // Top 4 highest-paid Pros as Featured (proxy for tier until pro_tier column ships)
  const featured = visible.slice(0, 4);
  const allOthers = visible.slice(4);

  return (
    <div>
      {/* Gold hero */}
      <div className="relative overflow-hidden border-b border-amber-100/60">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(252,211,77,0.45),transparent_55%)]" />
        <div className="relative px-5 sm:px-6 pt-7 pb-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 backdrop-blur-sm ring-1 ring-amber-200 mb-3">
            <Sparkles className="w-3 h-3 text-amber-700" />
            <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-amber-900">Verified coaches</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>PaddleGrid Pros</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md leading-relaxed">Lessons, clinics, tournament prep, and online coaching with verified Pros across the entire network.</p>

          <div className="relative mt-5">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, specialty, or city…"
              className="w-full pl-10 pr-3 py-3 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-amber-200/60 focus:ring-2 focus:ring-amber-400 focus:outline-none text-sm shadow-sm" />
          </div>

          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            {SPECIALTY_FILTERS.map(s => (
              <button key={s} onClick={() => setChip(s)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition flex-shrink-0 ${chip === s ? 'bg-emerald-800 text-white' : 'bg-white/70 text-slate-600 ring-1 ring-amber-200/50 hover:bg-white'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
        {loading ? <ProsSkeleton /> : visible.length === 0 ? <EmptyPros q={q} chip={chip} onReset={() => { setQ(''); setChip('All'); }} /> : (
          <>
            {featured.length > 0 && (
              <section className="mb-7">
                <SectionHeader label="Featured Pros" hint="Elite tier" />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {featured.map((p, i) => <FeaturedCard key={p.id} p={p} delay={i * 0.04} onOpen={() => onOpenProfile?.(p.id)} />)}
                </div>
              </section>
            )}
            <section>
              <SectionHeader label={featured.length > 0 ? 'All Pros' : `${visible.length} Pros`} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {allOthers.map((p, i) => <ProCard key={p.id} p={p} delay={i * 0.02} onOpen={() => onOpenProfile?.(p.id)} />)}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between px-1">
      <h2 className="text-[11px] uppercase tracking-[0.22em] font-extrabold text-slate-500">{label}</h2>
      {hint && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-700"><Sparkles className="w-2.5 h-2.5" /> {hint}</span>}
    </div>
  );
}

function FeaturedCard({ p, delay, onOpen }: { p: Pro; delay: number; onOpen: () => void }) {
  return (
    <motion.button onClick={onOpen}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="group relative text-left rounded-2xl overflow-hidden ring-2 ring-amber-300/70 bg-gradient-to-br from-white via-amber-50/40 to-white p-4 hover:shadow-[0_14px_38px_rgba(217,119,6,0.12)] transition active:scale-[0.99]"
    >
      <Sparkles className="absolute top-2 right-2 w-3.5 h-3.5 text-amber-500" />
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 ring-2 ring-amber-400/70 flex-shrink-0">
          {p.profile_picture_url
            ? <img src={p.profile_picture_url} alt={p.full_name} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
            : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-bold">{p.full_name?.[0]?.toUpperCase() || '?'}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-slate-900 truncate">{p.full_name}</p>
            <ProBadge isPro={true} />
          </div>
          {p.pro_hourly_rate && <p className="text-[11px] text-emerald-800 font-bold mt-0.5">${p.pro_hourly_rate}/hr</p>}
        </div>
      </div>
      {p.pro_specialties && p.pro_specialties.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {p.pro_specialties.slice(0, 2).map(s => <span key={s} className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[9px] font-extrabold uppercase tracking-wider">{s}</span>)}
        </div>
      )}
    </motion.button>
  );
}

function ProCard({ p, delay, onOpen }: { p: Pro; delay: number; onOpen: () => void }) {
  return (
    <motion.button onClick={onOpen}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="group text-left rounded-2xl border border-slate-200/70 bg-white p-4 hover:border-emerald-200 hover:shadow-[0_10px_28px_rgba(22,41,30,0.06)] hover:-translate-y-px transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex-shrink-0">
          {p.profile_picture_url
            ? <img src={p.profile_picture_url} alt={p.full_name} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
            : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-bold">{p.full_name?.[0]?.toUpperCase() || '?'}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-slate-900 truncate">{p.full_name}</p>
            <ProBadge isPro={true} />
          </div>
          {p.pro_specialties && p.pro_specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {p.pro_specialties.slice(0, 3).map(s => <span key={s} className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold">{s}</span>)}
            </div>
          )}
          {p.pro_hourly_rate && (
            <p className="text-[11px] text-slate-600 mt-2 inline-flex items-center gap-1"><Trophy className="w-3 h-3 text-emerald-700" /> <span className="font-bold">${p.pro_hourly_rate}</span><span className="text-slate-400">/hr</span></p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function EmptyPros({ q, chip, onReset }: { q: string; chip: string; onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-amber-50/30 to-white p-12 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 ring-1 ring-amber-200/50 mb-3">
        <UserX className="w-7 h-7 text-amber-700" />
      </div>
      <p className="text-base font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>No Pros match</p>
      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
        {q ? <>Nothing for "<span className="font-semibold text-slate-700">{q}</span>"{chip !== 'All' && <> in {chip}</>}.</> : <>No Pros in {chip} right now.</>}
      </p>
      <button onClick={onReset} className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold">
        <Star className="w-3.5 h-3.5" /> Clear filters
      </button>
    </div>
  );
}

function ProsSkeleton() {
  return (
    <>
      <div className="h-3 w-32 bg-slate-100 rounded-full mb-3 animate-pulse" />
      <div className="grid grid-cols-2 gap-3 mb-7">
        {[0,1].map(i => (
          <div key={i} className="rounded-2xl ring-2 ring-amber-100 bg-gradient-to-br from-white via-amber-50/40 to-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-amber-100 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-2.5 w-1/3 bg-slate-100 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-3 w-24 bg-slate-100 rounded-full mb-3 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[0,1,2,3].map(i => (
          <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/2 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-2 w-2/3 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-2 w-1/4 bg-slate-100 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
