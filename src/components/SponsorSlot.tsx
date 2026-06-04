import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export type SponsorLocation =
  | 'feed_top'
  | 'play_top'
  | 'community_top'
  | 'me_top'
  | 'shop_top'
  | 'bookings_top'
  | 'profile_top'
  | 'messages_top'
  | 'admin_top'
  | 'leaderboard_top'
  | 'event_detail_top'
  | 'global_banner';

interface SponsorRow {
  id: string;
  name: string;
  tagline?: string | null;
  logo_url?: string | null;
  background_image_url?: string | null;
  brand_color?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
}

interface PlacementRow {
  id: string;
  sponsor_id: string;
  location: string;
  priority: number;
  sponsors: SponsorRow;
}

interface Props {
  location: SponsorLocation;
  facilityId?: string;
  /** Visual variant. 'banner' = full-width hero, 'card' = subtle inline. Default: 'banner' */
  variant?: 'banner' | 'card';
  className?: string;
}

/**
 * Renders the highest-priority active sponsor for the given location.
 * Tracks an impression on mount and a click when the CTA is followed.
 * Renders nothing if no active sponsor exists — the page lays out as if not present.
 *
 * Drop into the TOP of any page:
 *   <SponsorSlot location="feed_top" facilityId={facilityId} />
 *   <SponsorSlot location="bookings_top" facilityId={facilityId} variant="card" />
 */
export default function SponsorSlot({ location, facilityId, variant = 'banner', className = '' }: Props) {
  const [placement, setPlacement] = useState<PlacementRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let q = supabase
        .from('sponsor_placements')
        .select('id, sponsor_id, location, priority, sponsors(id, name, tagline, logo_url, background_image_url, brand_color, cta_label, cta_url)')
        .eq('location', location)
        .lte('start_at', new Date().toISOString())
        .or(`end_at.is.null,end_at.gt.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .limit(1);
      if (facilityId) q = q.eq('facility_id', facilityId);
      const { data, error } = await q;
      if (!mounted) return;
      if (error || !data || !data.length) { setLoaded(true); return; }
      const row = data[0] as unknown as PlacementRow;
      // Only render if the joined sponsor is active
      if (!row.sponsors) { setLoaded(true); return; }
      setPlacement(row);
      setLoaded(true);
      // Fire-and-forget impression
      void supabase.rpc('increment_sponsor_impression', { p_placement_id: row.id }).then((res) => {
        if (res.error) {
          // Fall back to direct update if RPC doesn't exist
          void supabase.from('sponsor_placements').update({ impressions: (row as any).impressions ? (row as any).impressions + 1 : 1 }).eq('id', row.id);
        }
      });
    })();
    return () => { mounted = false; };
  }, [location, facilityId]);

  const trackClick = async () => {
    if (!placement) return;
    void supabase.rpc('increment_sponsor_click', { p_placement_id: placement.id }).then((res) => {
      if (res.error) {
        void supabase.from('sponsor_placements').update({ clicks: (placement as any).clicks ? (placement as any).clicks + 1 : 1 }).eq('id', placement.id);
      }
    });
  };

  if (!loaded || !placement) return null;
  const s = placement.sponsors;
  const brand = s.brand_color || '#2D4A38';

  if (variant === 'card') {
    return (
      <a
        href={s.cta_url || '#'}
        onClick={trackClick}
        rel="noopener noreferrer"
        className={`group flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white px-3 py-2.5 hover:border-emerald-300 hover:shadow-sm transition ${className}`}
      >
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
          {s.logo_url && <img src={s.logo_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Sponsored · {s.name}</div>
          <div className="text-sm text-slate-700 truncate">{s.tagline}</div>
        </div>
        {s.cta_label && (
          <span className="text-xs font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
            {s.cta_label}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        )}
      </a>
    );
  }

  // banner variant
  return (
    <motion.a
      href={s.cta_url || '#'}
      onClick={trackClick}
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative block rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 mb-3 group ${className}`}
      style={{ background: brand }}
    >
      {s.background_image_url && (
        <div
          className="absolute inset-0 opacity-25 group-hover:opacity-30 transition-opacity"
          style={{ backgroundImage: `url(${s.background_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(90deg, ${brand} 0%, ${brand}cc 60%, ${brand}66 100%)` }}
      />
      <div className="relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5">
        {s.logo_url && (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white/95 flex-shrink-0 ring-1 ring-white/30">
            <img src={s.logo_url} alt={s.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0 text-white">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/70 font-bold">
            Sponsored · {s.name}
          </div>
          <div className="text-sm sm:text-[15px] font-semibold mt-0.5 leading-snug truncate">
            {s.tagline}
          </div>
        </div>
        {s.cta_label && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold transition-transform group-hover:translate-x-0.5 flex-shrink-0">
            {s.cta_label}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </motion.a>
  );
}
