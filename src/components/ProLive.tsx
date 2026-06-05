import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Play, Tag, Calendar, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProBadge from './social/ProBadge';

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  status: 'scheduled' | 'live' | 'ended';
  scheduled_at: string;
  viewer_peak: number;
  pro: { id: string; full_name: string; profile_picture_url: string | null };
}
interface Product {
  id: string;
  pro_id: string;
  name: string;
  image_url: string | null;
  price_cents: number;
  affiliate_partner: string | null;
  affiliate_url: string | null;
  pro: { full_name: string; profile_picture_url: string | null };
}

/**
 * Pro Live — TikTok-Shop style. Live sessions at the top, shoppable products below.
 * Streaming infra (WebRTC) is NOT included — this is the storefront shell that
 * lists sessions + products and routes to the stream_url when a Pro goes live.
 */
export default function ProLive() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('pro_live_sessions')
          .select('id, title, description, status, scheduled_at, viewer_peak, pro:profiles!pro_live_sessions_pro_id_fkey(id, full_name, profile_picture_url)')
          .in('status', ['scheduled', 'live'])
          .order('scheduled_at', { ascending: true })
          .limit(20),
        supabase.from('pro_products')
          .select('id, pro_id, name, image_url, price_cents, affiliate_partner, affiliate_url, pro:profiles!pro_products_pro_id_fkey(full_name, profile_picture_url)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      setSessions((s as any) || []);
      setProducts((p as any) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 text-rose-800 text-[10px] font-extrabold uppercase tracking-wider mb-2">
          Live now
        </div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Pro Live</h1>
        <p className="text-xs text-slate-500 mt-1">Watch Pros review gear, drill techniques, and shop their picks.</p>
      </div>

      {loading ? <div className="py-12 flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
        <>
          <section className="mb-7">
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">Upcoming + live</h2>
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No live sessions scheduled.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sessions.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden">
                    <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                      <Play className="w-10 h-10 text-white/40" />
                      {s.status === 'live' && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider animate-pulse">Live</span>}
                      {s.status === 'scheduled' && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-wider"><Calendar className="w-2.5 h-2.5 inline mr-0.5" /> {new Date(s.scheduled_at).toLocaleDateString()}</span>}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-slate-900 truncate">{s.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-5 h-5 rounded-full overflow-hidden bg-slate-100">
                          {s.pro.profile_picture_url ? <img src={s.pro.profile_picture_url} alt="" className="w-full h-full object-cover" /> : null}
                        </span>
                        <span className="text-[11px] text-slate-600">{s.pro.full_name}</span>
                        <ProBadge isPro={true} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">Shop the picks</h2>
            {products.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No products yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((p) => (
                  <a key={p.id} href={p.affiliate_url || '#'} target="_blank" rel="noopener noreferrer"
                    className="block rounded-2xl border border-slate-200/70 bg-white overflow-hidden hover:shadow-md transition">
                    <div className="aspect-square bg-slate-100 relative">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <ShoppingCart className="w-8 h-8 text-slate-300 absolute inset-0 m-auto" />}
                      {p.affiliate_partner && <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-white/85 text-slate-700 text-[9px] font-extrabold uppercase tracking-wider"><Tag className="w-2.5 h-2.5 inline mr-0.5" /> {p.affiliate_partner}</span>}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">by {p.pro.full_name}</p>
                      <p className="text-sm font-bold text-emerald-900 mt-1">${(p.price_cents/100).toFixed(0)}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
