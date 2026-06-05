import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Award, MessageCircle, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AvatarStack from './AvatarStack';

interface Coach {
  id: string;
  pro_id: string;
  title: string | null;
  display_order: number;
  profiles: {
    id: string;
    full_name: string;
    profile_picture_url: string | null;
    pro_bio: string | null;
    pro_specialties: string[] | null;
    pro_hourly_rate: number | null;
  } | null;
}

interface Props {
  facilityId: string;
  onRequestLesson?: (proId: string, proName: string) => void;
  onRequestClinic?: (proId: string, proName: string) => void;
  onOpenProfile?: (proId: string) => void;
}

/**
 * Ambassador pros at a facility. Cards show avatar, name, specialty chips,
 * rate, and two CTAs — "Book lesson" and "Request clinic".
 * Renders nothing if the facility has no active ambassadors.
 */
export default function CoachesSection({ facilityId, onRequestLesson, onRequestClinic, onOpenProfile }: Props) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('ambassadors')
        .select(`
          id, pro_id, title, display_order,
          profiles:pro_id(id, full_name, profile_picture_url, pro_bio, pro_specialties, pro_hourly_rate)
        `)
        .eq('facility_id', facilityId)
        .eq('status', 'active')
        .order('display_order', { ascending: true });
      if (!mounted) return;
      setCoaches((data as any) || []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [facilityId]);

  if (loading || coaches.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>
            <Award className="w-4 h-4 text-emerald-700" />
            Coaches in residence
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">PaddleGrid Pros affiliated with this facility</p>
        </div>
        <div className="flex items-center gap-2">
          <AvatarStack
            size="sm"
            max={4}
            followers={coaches.slice(0, 4).map(c => ({
              id: c.id,
              name: c.profiles?.full_name || null,
              avatarUrl: c.profiles?.profile_picture_url || null,
            }))}
            totalCount={coaches.length}
          />
          <span className="text-[11px] text-slate-400 font-medium">{coaches.length} {coaches.length === 1 ? 'pro' : 'pros'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {coaches.map((c, i) => {
          const p = c.profiles;
          if (!p) return null;
          return (
            <motion.article
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-slate-200/70 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onOpenProfile?.(p.id)}
                  className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex-shrink-0 hover:ring-emerald-300 transition"
                >
                  {p.profile_picture_url ? (
                    <img src={p.profile_picture_url} alt={p.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-bold">
                      {p.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 px-1.5 py-px rounded-full bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase tracking-wider ring-2 ring-white">
                    Pro
                  </span>
                </button>

                <div className="flex-1 min-w-0">
                  <button onClick={() => onOpenProfile?.(p.id)} className="text-left">
                    <div className="text-[15px] font-bold text-slate-900 truncate hover:text-emerald-800">{p.full_name}</div>
                    {c.title && <div className="text-[11px] text-emerald-800 font-semibold mt-0.5 uppercase tracking-wide">{c.title}</div>}
                  </button>

                  {p.pro_specialties && p.pro_specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.pro_specialties.slice(0, 3).map((sp) => (
                        <span key={sp} className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                          {sp}
                        </span>
                      ))}
                    </div>
                  )}

                  {p.pro_bio && (
                    <p className="text-xs text-slate-600 leading-snug mt-2 line-clamp-2">{p.pro_bio}</p>
                  )}

                  {p.pro_hourly_rate != null && (
                    <div className="text-xs text-slate-500 font-semibold mt-2">${p.pro_hourly_rate}/hr</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => onRequestLesson?.(p.id, p.full_name)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-[13px] font-bold transition"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Book lesson
                </button>
                <button
                  onClick={() => onRequestClinic?.(p.id, p.full_name)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-slate-700 hover:text-emerald-900 text-[13px] font-bold transition"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Request clinic
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
