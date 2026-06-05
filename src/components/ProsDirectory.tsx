import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, MapPin, Loader2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProBadge from './social/ProBadge';

interface Pro {
  id: string;
  full_name: string;
  profile_picture_url: string | null;
  pro_bio: string | null;
  pro_specialties: string[] | null;
  pro_hourly_rate: number | null;
  city: string | null;
}

/**
 * Browse all PaddleGrid Pros across facilities.
 * Filter by specialty + city. Click → profile.
 */
export default function ProsDirectory({ onOpenProfile }: { onOpenProfile?: (id: string) => void }) {
  const [pros, setPros] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url, pro_bio, pro_specialties, pro_hourly_rate')
        .eq('is_pro', true)
        .order('pro_since', { ascending: false })
        .limit(100);
      setPros((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const visible = pros.filter(p => !q || p.full_name.toLowerCase().includes(q.toLowerCase()) || (p.pro_specialties || []).some(s => s.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>PaddleGrid Pros</h1>
        <p className="text-xs text-slate-500 mt-1">Verified coaches across the network. Lessons, clinics, tournament prep.</p>
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or specialty…" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : visible.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-10">No pros match that search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visible.map((p, i) => (
            <motion.button key={p.id} onClick={() => onOpenProfile?.(p.id)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="text-left rounded-2xl border border-slate-200/70 bg-white p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex-shrink-0">
                  {p.profile_picture_url ? <img src={p.profile_picture_url} alt={p.full_name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-bold">{p.full_name?.[0]?.toUpperCase() || '?'}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.full_name}</p>
                    <ProBadge isPro={true} />
                  </div>
                  {p.city && <p className="text-[11px] text-slate-500 inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}</p>}
                  {p.pro_specialties && p.pro_specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.pro_specialties.slice(0, 3).map((s) => <span key={s} className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold">{s}</span>)}
                    </div>
                  )}
                  {p.pro_hourly_rate && (
                    <p className="text-[11px] text-slate-600 mt-2 inline-flex items-center gap-1"><Trophy className="w-3 h-3 text-emerald-700" /> <span className="font-bold">${p.pro_hourly_rate}</span><span className="text-slate-400">/hr</span></p>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
