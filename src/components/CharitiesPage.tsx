import { useEffect, useState } from 'react';
import { Heart, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Charity {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  ein: string | null;
}

/**
 * Browse charities and donate via Stripe Checkout (one-time donation).
 */
export default function CharitiesPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState<string | null>(null);
  const [amount, setAmount] = useState(25);
  const [open, setOpen] = useState<Charity | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('charities').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(40);
      setList((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const donate = async (c: Charity) => {
    if (!user) return;
    setDonating(c.id);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-charity-checkout', {
        body: { charity_id: c.id, amount_cents: amount * 100, return_url: window.location.origin + '/charities/thank-you' },
      });
      if (error) throw error;
      const url = (data as any)?.checkout_url;
      if (url) window.location.href = url;
    } catch (e) {
      console.error(e);
    } finally {
      setDonating(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 text-rose-800 text-[10px] font-extrabold uppercase tracking-wider mb-2">
          <Heart className="w-3 h-3" /> Charities
        </div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Give back</h1>
        <p className="text-xs text-slate-500 mt-1">Donate to organizations growing the game. 100% of your gift goes to the charity — PaddleGrid covers the Stripe fee.</p>
      </div>

      {loading ? <div className="py-12 flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div> : list.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-10">No charities listed yet.</p>
      ) : (
        <div className="space-y-3">
          {list.map(c => (
            <div key={c.id} className="rounded-2xl border border-slate-200/70 bg-white p-4">
              <div className="flex items-start gap-3">
                {c.logo_url && <img src={c.logo_url} alt={c.name} className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                  {c.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">{c.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Visit site</a>}
                    {c.ein && <span className="text-[10px] text-slate-400">EIN {c.ein}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {[10, 25, 50, 100].map(v => (
                  <button key={v} onClick={() => { setOpen(c); setAmount(v); }}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 ring-1 ring-slate-200 hover:ring-emerald-200 text-xs font-bold transition">
                    ${v}
                  </button>
                ))}
                <div className="flex-1" />
                <button onClick={() => donate(c)} disabled={donating === c.id || !user}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold disabled:opacity-50">
                  {donating === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Heart className="w-3 h-3" />}
                  Donate ${amount}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
