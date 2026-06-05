import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProBadge from './social/ProBadge';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Upsell modal — "Become a PaddleGrid Pro." Subscribes the user to the
 * paddlegrid_pro_subscriptions tier via Stripe, granting them is_pro=true
 * across the entire network (separate from facility-level memberships).
 */
export default function PaddleGridProUpsell({ open, onClose }: Props) {
  const { user } = useAuth();
  const [tier, setTier] = useState<'standard' | 'elite'>('standard');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const start = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-pro-checkout', {
        body: { tier, return_url: window.location.origin + '/pros/welcome' },
      });
      if (error) throw error;
      const url = (data as any)?.checkout_url;
      if (url) window.location.href = url;
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const TIERS = [
    { id: 'standard' as const, name: 'Standard', price: 19, perks: [
      'Verified Pro badge across the network',
      'Cross-facility Pros directory listing',
      'Accept lesson + clinic requests',
      'Up to 5 affiliate products on your shop',
    ]},
    { id: 'elite' as const, name: 'Elite', price: 49, perks: [
      'Everything in Standard',
      'Featured placement in the Pros directory',
      'Pro Live streaming + commerce enabled',
      'Unlimited affiliate products',
      'Virtual coaching slot management',
      'Direct booking from your profile',
    ]},
  ];

  return (
    <div onClick={onClose} className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(22,41,30,0.55)' }}>
      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 bg-gradient-to-br from-emerald-900 to-emerald-700 text-white">
          <div className="flex items-center gap-2 mb-2">
            <ProBadge isPro={true} size="md" />
            <span className="text-[11px] uppercase tracking-[0.18em] font-extrabold">PaddleGrid Pro</span>
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Become a verified Pro</h2>
          <p className="text-xs text-emerald-100 mt-1 leading-snug">Earn from lessons, clinics, virtual sessions, and affiliate products. The Pro badge unlocks it all.</p>
        </div>

        <div className="px-5 py-4 space-y-2">
          {TIERS.map(t => {
            const picked = tier === t.id;
            return (
              <button key={t.id} onClick={() => setTier(t.id)}
                className={`w-full text-left rounded-xl border-2 p-3 transition ${picked ? 'border-emerald-700 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    {picked && <Check className="w-4 h-4 text-emerald-700" />}
                  </div>
                  <div className="text-right">
                    <p className="text-[18px] font-bold text-slate-900">${t.price}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">/mo</p>
                  </div>
                </div>
                <ul className="space-y-0.5">
                  {t.perks.map((p, i) => (
                    <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" /> <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="px-5 pb-5">
          <button onClick={start} disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Start free trial
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-2">7 days free. Cancel anytime.</p>
        </div>
      </motion.div>
    </div>
  );
}
