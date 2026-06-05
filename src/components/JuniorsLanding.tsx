import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Calendar, GraduationCap, Tent, Users2, Plus, Trophy, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Program {
  id: string;
  name: string;
  kind: 'lesson' | 'camp' | 'homeschooling' | 'league' | 'clinic';
  description: string | null;
  age_min: number;
  age_max: number;
  price_cents: number;
  schedule: string | null;
  capacity: number | null;
  enrolled: number;
  image_url: string | null;
  facilities: { id: string; name: string; slug: string };
}

interface Child { id: string; full_name: string; profile_picture_url: string | null }

const KIND_META: Record<Program['kind'], { icon: any; bg: string; ink: string; ring: string; label: string }> = {
  lesson:        { icon: GraduationCap, bg: 'bg-emerald-50',  ink: 'text-emerald-900',  ring: 'ring-emerald-200', label: 'Lessons' },
  camp:          { icon: Tent,          bg: 'bg-amber-50',    ink: 'text-amber-900',    ring: 'ring-amber-200',   label: 'Camps' },
  homeschooling: { icon: BookOpen,      bg: 'bg-sky-50',      ink: 'text-sky-900',      ring: 'ring-sky-200',     label: 'Homeschool' },
  league:        { icon: Trophy,        bg: 'bg-rose-50',     ink: 'text-rose-900',     ring: 'ring-rose-200',    label: 'Leagues' },
  clinic:        { icon: Users2,        bg: 'bg-violet-50',   ink: 'text-violet-900',   ring: 'ring-violet-200',  label: 'Clinics' },
};

/**
 * Juniors — playful illustrated hero, parent's child manager, then a
 * vibrant program catalog grouped by kind.
 */
export default function JuniorsLanding({ onAddChild }: { onAddChild?: () => void }) {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<'all' | Program['kind']>('all');

  useEffect(() => {
    void (async () => {
      const { data: progs } = await supabase
        .from('junior_programs')
        .select('id, name, kind, description, age_min, age_max, price_cents, schedule, capacity, enrolled, image_url, facilities:facility_id(id, name, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(40);
      setPrograms((progs as any) || []);

      if (user) {
        const { data: kids } = await supabase
          .from('guardian_children')
          .select('child_profile_id, profiles!guardian_children_child_profile_id_fkey(id, full_name, profile_picture_url)')
          .eq('guardian_id', user.id);
        setChildren(((kids as any) || []).map((r: any) => r.profiles).filter(Boolean));
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const visible = useMemo(
    () => (kind === 'all' ? programs : programs.filter(p => p.kind === kind)),
    [programs, kind]
  );

  return (
    <div>
      {/* Playful hero with paddle confetti */}
      <div className="relative overflow-hidden border-b border-emerald-100/60">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-amber-50/40 to-white" />
        <Confetti />
        <div className="relative px-5 sm:px-6 pt-7 pb-7 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-sm ring-1 ring-amber-200 mb-3 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-emerald-900">For the next generation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Junior <span className="text-emerald-800">pickleball.</span></h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md leading-relaxed">Lessons, camps, leagues, and homeschool tracks across PaddleGrid's network. Parent-managed accounts, kid-safe profiles.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
        {/* My kids */}
        <section className="mb-6 rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.18em] font-extrabold text-emerald-900">My kids</p>
            {user && (
              <button onClick={onAddChild}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition active:scale-[0.97]">
                <Plus className="w-3 h-3" /> Add child
              </button>
            )}
          </div>
          {children.length === 0 ? (
            <div className="flex items-center gap-3 pt-2">
              <KidsAvatarStack />
              <div>
                <p className="text-xs text-emerald-900 font-semibold">Add a child to enroll them</p>
                <p className="text-[11px] text-emerald-900/60 mt-0.5">Each child gets a parent-managed profile.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-2">
              {children.map(c => (
                <div key={c.id} className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white shadow-sm ring-1 ring-emerald-100">
                  <span className="w-7 h-7 rounded-full overflow-hidden bg-emerald-200 flex items-center justify-center">
                    {c.profile_picture_url ? <img src={c.profile_picture_url} alt={c.full_name} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-emerald-800">{c.full_name[0]}</span>}
                  </span>
                  <span className="text-xs font-bold text-emerald-900">{c.full_name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Kind filters as pill chips with icons */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          <FilterChip label="All" active={kind === 'all'} onClick={() => setKind('all')} />
          {(Object.keys(KIND_META) as Program['kind'][]).map(k => {
            const m = KIND_META[k];
            return <FilterChip key={k} label={m.label} icon={<m.icon className="w-3 h-3" />} active={kind === k} onClick={() => setKind(k)} />;
          })}
        </div>

        {loading ? <JuniorsSkeleton /> : visible.length === 0 ? <EmptyJuniors kind={kind} onReset={() => setKind('all')} /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {visible.map((p, i) => <ProgramCard key={p.id} p={p} delay={i * 0.03} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, icon, active, onClick }: { label: string; icon?: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition flex-shrink-0 ${active ? 'bg-emerald-800 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
      {icon}
      {label}
    </button>
  );
}

function ProgramCard({ p, delay }: { p: Program; delay: number }) {
  const m = KIND_META[p.kind] || KIND_META.lesson;
  const Icon = m.icon;
  const pct = p.capacity ? Math.min(100, ((p.enrolled || 0) / p.capacity) * 100) : null;
  return (
    <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="group rounded-3xl border border-slate-200/70 bg-white overflow-hidden hover:-translate-y-px hover:shadow-[0_14px_30px_rgba(22,41,30,0.07)] transition">
      <div className={`relative h-28 ${m.bg} overflow-hidden`}>
        {p.image_url
          ? <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700" />
          : <div className="w-full h-full flex items-center justify-center"><Icon className={`w-12 h-12 ${m.ink} opacity-30`} /></div>}
        <span className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur ${m.ink} text-[10px] font-extrabold uppercase tracking-wider shadow-sm ring-1 ${m.ring}`}>
          <Icon className="w-2.5 h-2.5" /> {m.label}
        </span>
        <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-[10px] font-bold text-slate-700 shadow-sm">
          Ages {p.age_min}–{p.age_max}
        </span>
      </div>
      <div className="px-4 py-3.5">
        <h3 className="text-sm font-bold text-slate-900 leading-snug">{p.name}</h3>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">at {p.facilities.name}</p>
        {p.schedule && <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-snug">{p.schedule}</p>}
        <div className="flex items-center justify-between mt-3 gap-2">
          <span className="text-base font-bold text-emerald-900">${(p.price_cents / 100).toFixed(0)}</span>
          {pct !== null ? (
            <div className="flex-1 max-w-[120px]">
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-slate-400">{p.enrolled || 0}/{p.capacity}</span>
                {pct >= 80 && <span className="text-rose-600 font-bold">Filling up</span>}
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${pct >= 80 ? 'bg-rose-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">{p.enrolled || 0} enrolled</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function KidsAvatarStack() {
  const colors = ['bg-emerald-300', 'bg-amber-300', 'bg-sky-300'];
  return (
    <div className="flex -space-x-2">
      {colors.map((c, i) => (
        <span key={i} className={`w-9 h-9 rounded-full ${c} ring-2 ring-white flex items-center justify-center`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/80" fill="currentColor"><circle cx="12" cy="9" r="3.5" /><path d="M5 21c0-3.5 3-6 7-6s7 2.5 7 6" /></svg>
        </span>
      ))}
    </div>
  );
}

function Confetti() {
  return (
    <>
      <svg className="absolute top-3 right-4 w-9 h-9 text-amber-300/70 -rotate-12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2.5" /></svg>
      <svg className="absolute top-12 left-6 w-5 h-5 text-emerald-400/60" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 14,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 10,9" /></svg>
      <svg className="absolute bottom-3 right-12 w-7 h-7 text-rose-300/60 rotate-12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2" /></svg>
      <svg className="absolute top-6 left-1/3 w-4 h-4 text-sky-300/60" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="3" /></svg>
    </>
  );
}

function EmptyJuniors({ kind, onReset }: { kind: 'all' | Program['kind']; onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/40 via-amber-50/30 to-white p-12 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 ring-1 ring-emerald-200/50 mb-3">
        <GraduationCap className="w-7 h-7 text-emerald-700" />
      </div>
      <p className="text-base font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>
        {kind === 'all' ? 'No programs yet' : `No ${KIND_META[kind as Program['kind']]?.label.toLowerCase() || kind} right now`}
      </p>
      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Facilities are still rolling out junior offerings. Try a different category or check back next week.</p>
      {kind !== 'all' && (
        <button onClick={onReset} className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold">
          Show all programs
        </button>
      )}
    </div>
  );
}

function JuniorsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="rounded-3xl border border-slate-200/60 bg-white overflow-hidden">
          <div className="h-28 bg-gradient-to-br from-emerald-50 to-amber-50 animate-pulse" />
          <div className="px-4 py-3.5 space-y-2">
            <div className="h-3 w-2/3 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-2.5 w-1/2 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-2 w-3/4 bg-slate-100 rounded-full animate-pulse" />
            <div className="flex items-center justify-between mt-3">
              <div className="h-4 w-12 bg-emerald-100 rounded-full animate-pulse" />
              <div className="h-2 w-16 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
