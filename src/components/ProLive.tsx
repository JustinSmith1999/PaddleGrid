import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Play, Tag, Calendar, ShoppingBag, Radio, Tv2, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProBadge from './social/ProBadge';

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  status: 'scheduled' | 'live' | 'ended';
  scheduled_at: string;
  viewer_peak: number;
  thumbnail_url?: string | null;
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
 * Pro Live — TikTok-Shop style, dark mode.
 *
 * Hierarchy:
 *   1. LIVE NOW  (pulsing red ring, viewer count, big thumbnail)
 *   2. UPCOMING  (smaller cards, countdown)
 *   3. SHOP THE PICKS  (product grid)
 */
export default function ProLive() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('pro_live_sessions')
          .select('id, title, description, status, scheduled_at, viewer_peak, pro:pro_id(id, full_name, profile_picture_url)')
          .in('status', ['scheduled', 'live'])
          .order('scheduled_at', { ascending: true })
          .limit(20),
        supabase.from('pro_products')
          .select('id, pro_id, name, image_url, price_cents, affiliate_partner, affiliate_url, pro:pro_id(full_name, profile_picture_url)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      setSessions((s as any) || []);
      setProducts((p as any) || []);
      setLoading(false);
    })();
  }, []);

  const live = sessions.filter(s => s.status === 'live');
  const upcoming = sessions.filter(s => s.status === 'scheduled');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(244,63,94,0.35),transparent_55%),radial-gradient(circle_at_85%_120%,rgba(217,70,239,0.18),transparent_55%)]" />
        <div className="relative px-5 sm:px-6 pt-7 pb-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/15 ring-1 ring-rose-400/30 backdrop-blur-sm mb-3">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-70" />
              <span className="relative w-2 h-2 rounded-full bg-rose-500" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-rose-200">{live.length > 0 ? `${live.length} live now` : 'Going live soon'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Pro Live</h1>
          <p className="text-sm text-white/60 mt-2 max-w-md">Pros review gear, drill techniques, and answer questions in real time. Shop their picks straight from the stream.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
        {loading ? (
          <ProLiveSkeleton />
        ) : (
          <>
            {/* LIVE NOW */}
            {live.length > 0 && (
              <section className="mb-8">
                <SectionHeader label="Live now" accent="rose" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  {live.map((s, i) => (
                    <LiveCard key={s.id} s={s} delay={i * 0.05} variant="live" />
                  ))}
                </div>
              </section>
            )}

            {/* UPCOMING */}
            <section className="mb-8">
              <SectionHeader label={live.length ? 'Up next' : 'Going live soon'} accent="white" />
              {upcoming.length === 0 ? (
                <EmptyLiveState />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  {upcoming.map((s, i) => (
                    <LiveCard key={s.id} s={s} delay={i * 0.04} variant="upcoming" />
                  ))}
                </div>
              )}
            </section>

            {/* SHOP THE PICKS */}
            <section>
              <SectionHeader label="Shop the picks" accent="white" />
              {products.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                  <ShoppingBag className="w-7 h-7 text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-white/70 font-semibold">No products in stock yet</p>
                  <p className="text-xs text-white/40 mt-1">Pros add gear after their first live session.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {products.map((p, i) => <ProductCard key={p.id} p={p} delay={i * 0.03} />)}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, accent }: { label: string; accent: 'rose' | 'white' }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className={`text-[11px] uppercase tracking-[0.22em] font-extrabold ${accent === 'rose' ? 'text-rose-300' : 'text-white/50'}`}>{label}</h2>
      <ChevronRight className="w-3.5 h-3.5 text-white/20" />
    </div>
  );
}

function LiveCard({ s, delay, variant }: { s: LiveSession; delay: number; variant: 'live' | 'upcoming' }) {
  const isLive = variant === 'live';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`group relative rounded-2xl overflow-hidden border ${isLive ? 'border-rose-500/40 shadow-[0_0_0_1px_rgba(244,63,94,0.2),0_8px_28px_rgba(244,63,94,0.18)]' : 'border-white/10'} bg-gradient-to-br from-white/[0.05] to-white/[0.02] hover:from-white/[0.08] transition-colors`}
    >
      {/* Live pulse outline */}
      {isLive && <span className="pointer-events-none absolute -inset-px rounded-2xl ring-2 ring-rose-500/60 animate-pulse" />}

      <div className="aspect-video relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(244,63,94,0.4),transparent_70%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="w-12 h-12 text-white/40" fill="white" fillOpacity={0.1} />
        </div>
        {isLive ? (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
            <Radio className="w-2.5 h-2.5" /> Live
          </span>
        ) : (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-700/90 backdrop-blur-sm text-white text-[10px] font-extrabold uppercase tracking-wider">
            <Calendar className="w-2.5 h-2.5" /> {fmtSchedule(s.scheduled_at)}
          </span>
        )}
        {isLive && s.viewer_peak > 0 && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/55 backdrop-blur-sm text-white/95 text-[10px] font-bold">
            {s.viewer_peak.toLocaleString()} watching
          </span>
        )}
      </div>

      <div className="px-3.5 py-3">
        <p className="text-sm font-bold text-white truncate">{s.title}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="w-5 h-5 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            {s.pro.profile_picture_url ? <img src={s.pro.profile_picture_url} alt="" className="w-full h-full object-cover" /> : null}
          </span>
          <span className="text-[11px] text-white/70 truncate">{s.pro.full_name}</span>
          <ProBadge isPro={true} size="sm" />
        </div>
      </div>
    </motion.div>
  );
}

function ProductCard({ p, delay }: { p: Product; delay: number }) {
  return (
    <motion.a
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      href={p.affiliate_url || '#'} target="_blank" rel="noopener noreferrer"
      className="group block rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-rose-400/30 hover:shadow-[0_10px_36px_rgba(244,63,94,0.18)] transition"
    >
      <div className="aspect-square bg-white/5 relative overflow-hidden">
        {p.image_url
          ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
          : <ShoppingBag className="w-8 h-8 text-white/30 absolute inset-0 m-auto" />
        }
        {p.affiliate_partner && (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/90 text-slate-900 text-[9px] font-extrabold uppercase tracking-wider">
            <Tag className="w-2.5 h-2.5" /> {p.affiliate_partner}
          </span>
        )}
      </div>
      <div className="px-2.5 py-2.5">
        <p className="text-xs font-bold text-white truncate">{p.name}</p>
        <p className="text-[10px] text-white/50 mt-0.5 truncate">by {p.pro.full_name}</p>
        <p className="text-sm font-bold text-rose-300 mt-1">${(p.price_cents / 100).toFixed(0)}</p>
      </div>
    </motion.a>
  );
}

function EmptyLiveState() {
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-10 text-center">
      <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/15 ring-1 ring-rose-400/30 mb-3">
        <Tv2 className="w-7 h-7 text-rose-300" />
        <span className="absolute -inset-1 rounded-full ring-2 ring-rose-500/40 animate-ping" />
      </div>
      <p className="text-sm text-white font-semibold">No sessions scheduled right now</p>
      <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">Follow your favorite Pros — you'll get a push notification when they go live.</p>
    </div>
  );
}

function ProLiveSkeleton() {
  return (
    <>
      <div className="h-3.5 w-24 bg-white/10 rounded-full mb-4 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[0, 1].map(i => (
          <div key={i} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
            <div className="aspect-video bg-white/[0.05] animate-pulse" />
            <div className="p-3.5 space-y-2">
              <div className="h-3 w-2/3 bg-white/10 rounded-full animate-pulse" />
              <div className="h-2.5 w-1/3 bg-white/10 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-3.5 w-32 bg-white/10 rounded-full mb-4 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
            <div className="aspect-square bg-white/[0.05] animate-pulse" />
            <div className="p-2.5 space-y-1.5">
              <div className="h-2.5 w-3/4 bg-white/10 rounded-full animate-pulse" />
              <div className="h-2 w-1/3 bg-white/10 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function fmtSchedule(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (d.getTime() - now.getTime()) / 3600_000;
  if (diffH < 1) return `in ${Math.max(1, Math.round(diffH * 60))}m`;
  if (diffH < 12) return `in ${Math.round(diffH)}h`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
