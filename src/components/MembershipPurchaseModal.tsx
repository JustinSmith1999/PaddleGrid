import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, Sparkles, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Tier {
  id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  cadence: 'monthly' | 'annual' | 'one_time';
  perks?: string[] | null;
  stripe_price_id?: string | null;
}

interface Props {
  facilityId: string;
  facilityName: string;
  tiers: Tier[];
  onClose: () => void;
  onPurchased?: (tierId: string) => void;
}

/**
 * Membership purchase modal — picks a tier and hands off to Stripe Checkout
 * via the stripe-membership-checkout edge function. Returns user to /memberships/success.
 */
export default function MembershipPurchaseModal({ facilityId, facilityName, tiers, onClose, onPurchased }: Props) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(tiers[0]?.id || null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const buy = async () => {
    if (!user || !selected) return;
    setBusy(true);
    setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-membership-checkout', {
        body: { facility_id: facilityId, tier_id: selected, return_url: window.location.origin + '/memberships/success' },
      });
      if (error) throw error;
      const url = (data as any)?.checkout_url;
      if (!url) throw new Error('No checkout URL returned');
      onPurchased?.(selected);
      window.location.href = url;
    } catch (e: any) {
      setErr(e.message || 'Could not start checkout. Try again in a moment.');
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: 'rgba(22,41,30,0.55)' }}
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden"
        >
          <div className="flex items-start justify-between px-5 pt-5 pb-2">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Membership
              </span>
              <h2 className="text-lg font-semibold text-slate-900 mt-2" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Join {facilityName}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md text-slate-300 hover:text-slate-700 hover:bg-slate-50 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 pb-4 space-y-2">
            {tiers.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">This club hasn't set up paid memberships yet.</p>
            ) : (
              tiers.map((t) => {
                const isPicked = selected === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className={`w-full text-left rounded-xl border-2 p-3 transition ${isPicked ? 'border-emerald-700 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate">{t.name}</p>
                          {isPicked && <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />}
                        </div>
                        {t.description && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{t.description}</p>}
                        {t.perks && t.perks.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {t.perks.slice(0, 4).map((p, i) => (
                              <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                                <span className="text-emerald-700 mt-0.5">·</span> <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[18px] font-bold text-slate-900">${(t.price_cents / 100).toFixed(0)}</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{t.cadence === 'annual' ? '/yr' : t.cadence === 'monthly' ? '/mo' : 'one-time'}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {err && <p className="px-5 pb-2 text-xs text-rose-700">{err}</p>}

          {tiers.length > 0 && (
            <div className="px-5 pb-5 pt-1">
              <button
                onClick={buy}
                disabled={busy || !selected}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold disabled:opacity-60 transition"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Continue to checkout
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">Powered by Stripe. Cancel any time from your profile.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
