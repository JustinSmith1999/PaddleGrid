import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, Loader2, X, DollarSign, TrendingUp, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProBadge from './social/ProBadge';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TIERS = [
  {
    id: 'standard' as const,
    name: 'Standard',
    price: 19,
    blurb: 'Get verified and start earning.',
    perks: [
      { label: 'Verified Pro badge across the network', included: true },
      { label: 'Cross-facility Pros directory listing', included: true },
      { label: 'Accept lesson + clinic requests', included: true },
      { label: 'Up to 5 affiliate products on your shop', included: true },
      { label: 'Featured placement in the directory', included: false },
      { label: 'Pro Live streaming + commerce', included: false },
      { label: 'Virtual coaching booking', included: false },
    ],
  },
  {
    id: 'elite' as const,
    name: 'Elite',
    price: 49,
    blurb: 'Build a real business.',
    badge: 'Most popular',
    perks: [
      { label: 'Everything in Standard', included: true },
      { label: 'Featured placement in the directory', included: true },
      { label: 'Pro Live streaming + commerce', included: true },
      { label: 'Virtual coaching booking', included: true },
      { label: 'Unlimited affiliate products', included: true },
      { label: 'Direct booking from your profile', included: true },
      { label: 'Priority push to nearby learners', included: true },
    ],
  },
];

/**
 * PaddleGrid Pro upsell — aspirational full-screen sheet.
 * Hero with paddle silhouettes, social proof, earnings preview, tier compare.
 */
export default function PaddleGridProUpsell({ open, onClose }: Props) {
  const { user } = useAuth();
  const [tier, setTier] = useState<'standard' | 'elite'>('elite');
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
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl"
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>

        {/* Aspirational hero */}
        <div className="relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-700" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(252,211,77,0.28),transparent_55%),radial-gradient(circle_at_75%_120%,rgba(16,185,129,0.45),transparent_50%)]" />
          {/* Faint paddle silhouettes */}
          <svg className="absolute -right-6 -top-6 w-44 h-44 opacity-[0.06]" viewBox="0 0 100 100" fill="white">
            <ellipse cx="50" cy="36" rx="28" ry="32" />
            <path d="M42 60 h16 v34 a8 8 0 0 1 -16 0 Z" />
          </svg>
          <svg className="absolute -left-8 bottom-2 w-32 h-32 opacity-[0.05] -rotate-12" viewBox="0 0 100 100" fill="white">
            <ellipse cx="50" cy="36" rx="28" ry="32" />
            <path d="M42 60 h16 v34 a8 8 0 0 1 -16 0 Z" />
          </svg>

          <div className="relative px-6 pt-7 pb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <ProBadge isPro={true} size="md" />
              <span className="text-[11px] uppercase tracking-[0.22em] font-extrabold text-amber-200">PaddleGrid Pro</span>
            </div>
            <h2 className="text-3xl font-bold leading-tight" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Turn your game<br />into a living.</h2>
            <p className="text-sm text-emerald-100/85 mt-2 max-w-sm leading-relaxed">Lessons, clinics, virtual sessions, affiliate gear, live commerce. The Pro badge unlocks every revenue stream PaddleGrid offers.</p>

            {/* Social proof */}
            <div className="mt-5 flex items-center gap-4 text-emerald-50/90">
              <div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-200">Avg/mo</span>
                </div>
                <p className="text-xl font-bold mt-0.5">$2,400</p>
              </div>
              <div className="w-px h-9 bg-white/15" />
              <div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-200">Active Pros</span>
                </div>
                <p className="text-xl font-bold mt-0.5">540+</p>
              </div>
              <div className="w-px h-9 bg-white/15" />
              <div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-200">Take rate</span>
                </div>
                <p className="text-xl font-bold mt-0.5">0%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-2.5">
          {TIERS.map(t => {
            const picked = tier === t.id;
            return (
              <button key={t.id} onClick={() => setTier(t.id)}
                className={`group relative w-full text-left rounded-2xl border-2 p-4 transition active:scale-[0.99] ${picked ? 'border-emerald-700 bg-emerald-50/40 shadow-[0_8px_22px_rgba(22,41,30,0.10)]' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}`}>
                {t.badge && (
                  <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[9px] font-extrabold uppercase tracking-wider shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" /> {t.badge}
                  </span>
                )}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <p className="text-base font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>{t.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t.blurb}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 leading-none">${t.price}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">/month</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {t.perks.map((p, i) => (
                    <li key={i} className={`text-[12px] flex items-start gap-1.5 ${p.included ? 'text-slate-700' : 'text-slate-300 line-through'}`}>
                      <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${p.included ? 'text-emerald-700' : 'text-slate-200'}`} />
                      <span>{p.label}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="px-5 pb-7">
          <button onClick={start} disabled={busy || !user}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold disabled:opacity-60 shadow-[0_6px_22px_rgba(22,41,30,0.18)] active:scale-[0.98] transition">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Start free 7-day trial
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-2.5">No card required for trial. Cancel anytime.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
