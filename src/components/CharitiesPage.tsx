import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2, ExternalLink, Sparkles, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Charity {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  ein: string | null;
  goal_cents?: number | null;
  raised_cents?: number | null;
}

const PRESETS = [10, 25, 50, 100];

/**
 * Charities — warm sunrise theme. Donations flow through a confirmation step
 * before redirecting to Stripe Checkout (no surprise redirects on tap).
 */
export default function CharitiesPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<{ charity: Charity; amount: number } | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('charities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(40);
      setList((data as any) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="relative">
      {/* Sunrise hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-rose-50 to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-30%,rgba(251,191,36,0.4),transparent_60%)]" />
        <div className="relative px-5 sm:px-6 pt-7 pb-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 backdrop-blur-sm ring-1 ring-rose-200 mb-3">
            <Heart className="w-3 h-3 text-rose-600 fill-rose-600" />
            <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-rose-800">Give back</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Grow the game.</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md leading-relaxed">100% of your gift goes to the charity. PaddleGrid covers the Stripe processing fee. Tax-deductible where applicable.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
        {loading ? (
          <CharitiesSkeleton />
        ) : list.length === 0 ? (
          <EmptyCharities />
        ) : (
          <div className="space-y-3.5">
            {list.map((c, i) => <CharityCard key={c.id} c={c} delay={i * 0.04} onPick={(amount) => setOpen({ charity: c, amount })} />)}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <DonationConfirm
            charity={open.charity}
            amount={open.amount}
            user={user}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CharityCard({ c, delay, onPick }: { c: Charity; delay: number; onPick: (amount: number) => void }) {
  const pct = c.goal_cents && c.goal_cents > 0 ? Math.min(100, ((c.raised_cents || 0) / c.goal_cents) * 100) : null;
  return (
    <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="group rounded-2xl border border-rose-100/60 bg-white p-5 hover:shadow-[0_10px_28px_rgba(244,63,94,0.08)] hover:border-rose-200 transition">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-rose-100 ring-1 ring-rose-100 flex items-center justify-center flex-shrink-0">
          {c.logo_url
            ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover" />
            : <Heart className="w-6 h-6 text-rose-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>{c.name}</h3>
          {c.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">{c.description}</p>}
          <div className="flex items-center gap-3 mt-2">
            {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Site</a>}
            {c.ein && <span className="text-[10px] text-slate-400 tabular-nums">EIN {c.ein}</span>}
          </div>
        </div>
      </div>

      {pct !== null && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-[11px] mb-1">
            <span className="font-bold text-rose-700">${((c.raised_cents || 0) / 100).toLocaleString()} raised</span>
            <span className="text-slate-400">of ${((c.goal_cents || 0) / 100).toLocaleString()} goal</span>
          </div>
          <div className="h-1.5 bg-rose-50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2">
        {PRESETS.map(v => (
          <button key={v} onClick={() => onPick(v)}
            className="px-2 py-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100 text-amber-900 ring-1 ring-amber-200/60 hover:ring-amber-300 text-sm font-bold transition active:scale-[0.97]">
            ${v}
          </button>
        ))}
      </div>
    </motion.article>
  );
}

function DonationConfirm({ charity, amount: initialAmount, user, onClose }: { charity: Charity; amount: number; user: any; onClose: () => void }) {
  const [amount, setAmount] = useState(initialAmount);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'choose' | 'success'>('choose');

  const finalAmount = custom ? parseInt(custom) : amount;

  const start = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-charity-checkout', {
        body: { charity_id: charity.id, amount_cents: finalAmount * 100, return_url: window.location.origin + '/charities/thank-you' },
      });
      if (error) throw error;
      const url = (data as any)?.checkout_url;
      if (url) {
        setStep('success');
        setTimeout(() => { window.location.href = url; }, 700);
      }
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(22,41,30,0.55)' }}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-amber-50 via-rose-50 to-white">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white/60"><X className="w-4 h-4" /></button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-white ring-1 ring-rose-100 flex items-center justify-center">
              {charity.logo_url ? <img src={charity.logo_url} alt={charity.name} className="w-full h-full object-cover" /> : <Heart className="w-5 h-5 text-rose-500" />}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-rose-700">Donating to</p>
              <p className="text-sm font-bold text-slate-900">{charity.name}</p>
            </div>
          </div>
        </div>

        {step === 'choose' ? (
          <>
            <div className="px-5 py-5">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">Choose amount</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {PRESETS.map(v => {
                  const picked = !custom && amount === v;
                  return (
                    <button key={v} onClick={() => { setAmount(v); setCustom(''); }}
                      className={`relative px-2 py-3 rounded-xl text-sm font-bold transition ${picked ? 'bg-emerald-800 text-white ring-1 ring-emerald-800' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}>
                      ${v}
                      {picked && <Check className="w-3 h-3 absolute top-1 right-1" />}
                    </button>
                  );
                })}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">$</span>
                <input
                  inputMode="numeric"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Other amount"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-700"
                />
              </div>
              <div className="mt-4 rounded-xl bg-emerald-50/70 ring-1 ring-emerald-100 px-3 py-2.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <p className="text-[11px] text-emerald-900 leading-snug">100% of your <strong>${finalAmount || 0}</strong> goes to {charity.name}. We cover Stripe's fee.</p>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button onClick={start} disabled={busy || !user || !finalAmount}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold disabled:opacity-50 transition active:scale-[0.98]">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 fill-white" />}
                {user ? `Donate $${finalAmount || 0}` : 'Sign in to donate'}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">You'll be taken to Stripe to complete payment.</p>
            </div>
          </>
        ) : (
          <div className="px-5 py-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 ring-4 ring-emerald-50 mb-3">
              <Check className="w-7 h-7 text-emerald-700" strokeWidth={3} />
            </div>
            <p className="text-base font-bold text-slate-900">Taking you to checkout…</p>
            <p className="text-xs text-slate-500 mt-1">Thanks for supporting {charity.name}.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function EmptyCharities() {
  return (
    <div className="rounded-3xl border border-rose-100/70 bg-gradient-to-br from-amber-50/40 via-rose-50/40 to-white p-12 text-center">
      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 ring-4 ring-rose-50/70 mb-4">
        <Heart className="w-8 h-8 text-rose-500 fill-rose-200" />
      </div>
      <p className="text-base font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Charities coming soon</p>
      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">We're partnering with organizations growing the game. Check back next week.</p>
    </div>
  );
}

function CharitiesSkeleton() {
  return (
    <div className="space-y-3.5">
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-2xl border border-rose-100/40 bg-white p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/2 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-2.5 w-full bg-slate-100 rounded-full animate-pulse" />
              <div className="h-2.5 w-4/5 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[0,1,2,3].map(j => <div key={j} className="h-10 bg-amber-50/60 rounded-xl animate-pulse" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
