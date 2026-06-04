import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Handshake } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PartnerRow {
  id: string;
  tier: 'founding' | 'official' | 'community' | 'featured';
  display_order: number;
  partner_brands: {
    id: string;
    name: string;
    logo_url: string | null;
    brand_color: string | null;
    website: string | null;
    tagline: string | null;
  } | null;
}

interface Props {
  /** Either a facility ID or a pro/user ID */
  sponsoredId: string;
  sponsoredType: 'facility' | 'pro';
  /** Optional friendly name to anchor the strip ("Pickleball Heaven × …") */
  sponsoredName?: string;
}

/**
 * Renders the partner logos for a facility or pro as a sleek "X" row.
 * Hides itself if no active partnerships.
 */
export default function PartnershipsStrip({ sponsoredId, sponsoredType, sponsoredName }: Props) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('partnerships')
        .select('id, tier, display_order, partner_brands!partnerships_brand_id_fkey(id, name, logo_url, brand_color, website, tagline)')
        .eq('sponsored_id', sponsoredId)
        .eq('sponsored_type', sponsoredType)
        .is('ended_at', null)
        .order('tier', { ascending: true })       // 'founding' first alphabetically
        .order('display_order', { ascending: true });
      if (!mounted) return;
      setPartners((data as any) || []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [sponsoredId, sponsoredType]);

  if (loading || partners.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-2xl border border-slate-200/70 bg-gradient-to-r from-white via-slate-50/40 to-white px-4 sm:px-5 py-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1.5">
          <Handshake className="w-3.5 h-3.5 text-emerald-700" />
          {sponsoredName ? `${sponsoredName} partnerships` : 'Partnerships'}
        </h3>
        <span className="text-[10px] text-slate-400 font-semibold">{partners.length} {partners.length === 1 ? 'partner' : 'partners'}</span>
      </div>

      <div className="flex items-center gap-x-6 gap-y-3 flex-wrap">
        {partners.map((p) => {
          const b = p.partner_brands;
          if (!b) return null;
          const isFounding = p.tier === 'founding' || p.tier === 'official';
          return (
            <a
              key={p.id}
              href={b.website || '#'}
              target={b.website ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 transition"
              title={b.tagline || b.name}
            >
              {b.logo_url ? (
                <img
                  src={b.logo_url}
                  alt={b.name}
                  className={`object-contain transition group-hover:opacity-100 ${
                    isFounding ? 'h-8 opacity-90' : 'h-7 opacity-70'
                  }`}
                />
              ) : (
                <span
                  className={`px-3 py-1 rounded-md font-bold uppercase tracking-wide text-white ${
                    isFounding ? 'text-sm' : 'text-xs'
                  }`}
                  style={{ background: b.brand_color || '#2D4A38' }}
                >
                  {b.name}
                </span>
              )}
              {b.website && (
                <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition" />
              )}
            </a>
          );
        })}
      </div>
    </motion.section>
  );
}
