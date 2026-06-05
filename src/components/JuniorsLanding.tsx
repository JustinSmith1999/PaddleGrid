import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Calendar, GraduationCap, Tent, Users2, Plus } from 'lucide-react';
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

const KIND_ICON: Record<Program['kind'], any> = {
  lesson: GraduationCap,
  camp:   Tent,
  homeschooling: GraduationCap,
  league: Calendar,
  clinic: Users2,
};

/**
 * Junior section — parents manage child profiles, browse junior programs
 * (lessons, camps, homeschool track).
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
        .select('id, name, kind, description, age_min, age_max, price_cents, schedule, capacity, enrolled, image_url, facilities!junior_programs_facility_id_fkey(id, name, slug)')
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

  const visible = kind === 'all' ? programs : programs.filter(p => p.kind === kind);

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider mb-2">
          <Sparkles className="w-3 h-3" /> Juniors
        </div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Pickleball for the next generation</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-md">Lessons, camps, junior leagues, and homeschool tracks across the PaddleGrid network. Parent-managed accounts.</p>
      </div>

      <section className="mb-6 rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-900">My kids</p>
          {user && (
            <button onClick={onAddChild} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-emerald-800 hover:bg-emerald-100 text-[11px] font-bold">
              <Plus className="w-3 h-3" /> Add child
            </button>
          )}
        </div>
        {children.length === 0 ? (
          <p className="text-xs text-emerald-900/70">Add a child profile to enroll them in junior programs.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {children.map(c => (
              <div key={c.id} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white shadow-sm">
                <span className="w-6 h-6 rounded-full overflow-hidden bg-emerald-200">
                  {c.profile_picture_url ? <img src={c.profile_picture_url} alt={c.full_name} className="w-full h-full object-cover" /> : <span className="block w-full h-full text-[10px] font-bold text-emerald-800 flex items-center justify-center">{c.full_name[0]}</span>}
                </span>
                <span className="text-xs font-semibold text-emerald-900">{c.full_name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {(['all','lesson','camp','clinic','league','homeschooling'] as const).map(k => (
          <button key={k} onClick={() => setKind(k)} className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition flex-shrink-0 ${kind === k ? 'bg-emerald-800 text-white' : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'}`}>
            {k === 'all' ? 'All' : k}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : visible.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-10">No junior programs in that category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visible.map((p, i) => {
            const Icon = KIND_ICON[p.kind] || GraduationCap;
            return (
              <motion.article key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden">
                <div className="h-24 bg-emerald-50 relative">
                  {p.image_url
                    ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Icon className="w-10 h-10 text-emerald-300" /></div>}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-800 text-white text-[10px] font-extrabold uppercase tracking-wider">{p.kind}</span>
                </div>
                <div className="px-4 py-3.5">
                  <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">At {p.facilities.name} · Ages {p.age_min}–{p.age_max}</p>
                  {p.schedule && <p className="text-xs text-slate-600 mt-2">{p.schedule}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-emerald-900">${(p.price_cents / 100).toFixed(0)}</span>
                    <span className="text-[11px] text-slate-500">{p.capacity ? `${p.enrolled || 0}/${p.capacity}` : `${p.enrolled || 0} enrolled`}</span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
