import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Handshake, Award, Plus, Trash2, ExternalLink, Search, Crown, Inbox, Send, Mail, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props { facilityId?: string }

type Tab = 'coaches' | 'partners' | 'requests';

interface Coach {
  id: string; pro_id: string; status: string; title: string | null; display_order: number;
  profiles: { id: string; full_name: string; profile_picture_url: string | null; pro_specialties: string[] | null } | null;
}
interface Brand {
  id: string; name: string; logo_url: string | null; brand_color: string | null; website: string | null;
  tagline: string | null; category: string | null;
}
interface Partnership {
  id: string; brand_id: string; tier: string; display_order: number;
  partner_brands: Brand | null;
}
interface Request {
  id: string; kind: string; status: string; message: string | null; preferred_date: string | null;
  created_at: string; requester_id: string; pro_id: string | null;
  profiles_requester?: { full_name: string } | null;
  profiles_pro?:       { full_name: string } | null;
}

export default function AdminPartnerships({ facilityId }: Props) {
  const [tab, setTab] = useState<Tab>('coaches');

  return (
    <div className="px-4 sm:px-6 py-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <span className="inline-flex w-10 h-10 rounded-2xl bg-emerald-800 items-center justify-center text-white">
          <Handshake className="w-5 h-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Partnerships</h1>
          <p className="text-xs text-slate-500 mt-0.5">Coaches in residence, partner brands, and incoming lesson/clinic requests.</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-5 bg-slate-50/60 p-1 rounded-2xl w-fit">
        {([
          { id: 'coaches',  label: 'Coaches',         icon: Award },
          { id: 'partners', label: 'Partner brands',  icon: Handshake },
          { id: 'requests', label: 'Requests',        icon: Inbox },
        ] as const).map((t) => {
          const Active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition ${
                Active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'coaches'  && <CoachesTab  facilityId={facilityId} />}
      {tab === 'partners' && <PartnersTab facilityId={facilityId} />}
      {tab === 'requests' && <RequestsTab facilityId={facilityId} />}
    </div>
  );
}

/* ─── Coaches tab ─────────────────────────────────────────────────────────── */
function CoachesTab({ facilityId }: { facilityId?: string }) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [search, setSearch] = useState('');
  const [proResults, setProResults] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!facilityId) return;
    const { data } = await supabase
      .from('ambassadors')
      .select('id, pro_id, status, title, display_order, profiles:pro_id(id, full_name, profile_picture_url, pro_specialties)')
      .eq('facility_id', facilityId)
      .order('display_order', { ascending: true });
    setCoaches((data as any) || []);
  };
  useEffect(() => { load(); }, [facilityId]);

  const findPros = async () => {
    if (search.trim().length < 2) { setProResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, profile_picture_url, pro_specialties')
      .eq('is_pro', true)
      .ilike('full_name', `%${search.trim()}%`)
      .limit(8);
    setProResults(data || []);
  };
  useEffect(() => { findPros(); }, [search]);

  const invite = async (proId: string, title: string) => {
    if (!facilityId) return;
    setBusy(true);
    await supabase.from('ambassadors').upsert({ pro_id: proId, facility_id: facilityId, status: 'active', title }, { onConflict: 'pro_id,facility_id' });
    setSearch(''); setProResults([]);
    await load();
    setBusy(false);
  };
  const end = async (id: string) => {
    await supabase.from('ambassadors').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', id);
    await load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">Invite a PaddleGrid Pro</h2>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pros by name…"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700"
          />
          {proResults.length > 0 && (
            <div className="absolute z-10 mt-1 left-0 right-0 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {proResults.map((p) => (
                <button key={p.id} onClick={() => invite(p.id, 'Pro in residence')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-emerald-50/40 text-left">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                    {p.profile_picture_url ? <img src={p.profile_picture_url} className="w-full h-full object-cover" alt="" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{p.full_name}</div>
                    <div className="text-[10px] text-slate-400">{(p.pro_specialties || []).slice(0,2).join(' · ')}</div>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-700" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">Current coaches ({coaches.filter(c => c.status === 'active').length})</h2>
        {coaches.filter(c => c.status === 'active').length === 0 ? (
          <p className="text-sm text-slate-400 italic">No coaches yet. Invite a pro above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {coaches.filter(c => c.status === 'active').map((c) => {
              const p = c.profiles; if (!p) return null;
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
                    {p.profile_picture_url ? <img src={p.profile_picture_url} alt="" className="w-full h-full object-cover"/> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{p.full_name}</div>
                    <div className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wide">{c.title || 'Pro in residence'}</div>
                  </div>
                  <button onClick={() => end(c.id)} className="text-slate-300 hover:text-rose-600 p-1.5" disabled={busy}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Partner brands tab ──────────────────────────────────────────────────── */
function PartnersTab({ facilityId }: { facilityId?: string }) {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<Partial<Brand>>({ name: '', tagline: '', logo_url: '', website: '', category: 'paddle' });

  const load = async () => {
    if (!facilityId) return;
    const [{ data: p }, { data: b }] = await Promise.all([
      supabase.from('partnerships')
        .select('id, brand_id, tier, display_order, partner_brands!partnerships_brand_id_fkey(id, name, logo_url, brand_color, website, tagline, category)')
        .eq('sponsored_id', facilityId)
        .eq('sponsored_type', 'facility')
        .is('ended_at', null)
        .order('display_order'),
      supabase.from('partner_brands').select('*').order('name'),
    ]);
    setPartnerships((p as any) || []);
    setBrands(b || []);
  };
  useEffect(() => { load(); }, [facilityId]);

  const addPartner = async (brandId: string, tier: string) => {
    if (!facilityId) return;
    await supabase.from('partnerships').upsert(
      { brand_id: brandId, sponsored_id: facilityId, sponsored_type: 'facility', tier, display_order: partnerships.length },
      { onConflict: 'brand_id,sponsored_type,sponsored_id' }
    );
    await load();
  };
  const removePartner = async (id: string) => {
    await supabase.from('partnerships').update({ ended_at: new Date().toISOString() }).eq('id', id);
    await load();
  };

  const createBrand = async () => {
    if (!form.name) return;
    const { data } = await supabase.from('partner_brands').insert({ ...form }).select().single();
    if (data) {
      setShowNew(false);
      setForm({ name: '', tagline: '', logo_url: '', website: '', category: 'paddle' });
      await load();
      if (facilityId) addPartner(data.id, 'community');
    }
  };

  const partneredIds = new Set(partnerships.map((p) => p.brand_id));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">Active partnerships</h2>
        {partnerships.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No partnerships yet.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {partnerships.map((p) => {
              const b = p.partner_brands; if (!b) return null;
              return (
                <div key={p.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white">
                  {b.logo_url ? <img src={b.logo_url} alt={b.name} className="h-5 object-contain" /> : <span className="text-xs font-bold">{b.name}</span>}
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">{p.tier}</span>
                  <button onClick={() => removePartner(p.id)} className="text-slate-300 hover:text-rose-600 ml-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Available brands</h2>
          <button onClick={() => setShowNew((v) => !v)} className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-700 hover:text-emerald-900">
            <Plus className="w-3.5 h-3.5" /> {showNew ? 'Cancel' : 'New brand'}
          </button>
        </div>

        {showNew && (
          <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/30 p-3 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input placeholder="Brand name" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Logo URL" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" value={form.logo_url || ''} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
            <input placeholder="Website" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <input placeholder="Tagline" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" value={form.tagline || ''} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            <select className="px-3 py-2 rounded-lg border border-slate-200 text-sm" value={form.category || 'paddle'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="paddle">Paddle</option>
              <option value="beverage">Beverage</option>
              <option value="apparel">Apparel</option>
              <option value="nutrition">Nutrition</option>
              <option value="tech">Tech</option>
              <option value="other">Other</option>
            </select>
            <button onClick={createBrand} className="px-3 py-2 rounded-lg bg-emerald-800 text-white text-sm font-bold">Create + partner</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {brands.map((b) => {
            const already = partneredIds.has(b.id);
            return (
              <div key={b.id} className={`flex items-center gap-2 p-2 rounded-xl border ${already ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white'}`}>
                {b.logo_url ? <img src={b.logo_url} alt="" className="h-6 object-contain flex-shrink-0" /> : <Crown className="w-5 h-5 text-slate-300 flex-shrink-0" />}
                <span className="text-sm font-semibold flex-1 truncate">{b.name}</span>
                {already ? (
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">In</span>
                ) : (
                  <button onClick={() => addPartner(b.id, 'community')} className="text-emerald-700 hover:text-emerald-900 p-1">
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Requests tab ────────────────────────────────────────────────────────── */
function RequestsTab({ facilityId }: { facilityId?: string }) {
  const [reqs, setReqs] = useState<Request[]>([]);
  const load = async () => {
    if (!facilityId) return;
    const { data } = await supabase
      .from('lesson_requests')
      .select(`id, kind, status, message, preferred_date, created_at, requester_id, pro_id,
               profiles_requester:profiles!lesson_requests_requester_id_fkey(full_name),
               profiles_pro:profiles!lesson_requests_pro_id_fkey(full_name)`)
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false })
      .limit(50);
    setReqs((data as any) || []);
  };
  useEffect(() => { load(); }, [facilityId]);

  const setStatus = async (id: string, status: string) => {
    await supabase.from('lesson_requests').update({ status }).eq('id', id);
    await load();
  };

  if (reqs.length === 0) {
    return <p className="text-sm text-slate-400 italic">No incoming lesson or clinic requests yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {reqs.map((r) => (
        <li key={r.id} className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide
                ${r.kind === 'clinic' ? 'bg-amber-50 text-amber-700' : r.kind === 'ambassador_invite' ? 'bg-fuchsia-50 text-fuchsia-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {r.kind.replace('_', ' ')}
              </span>
              <span className="text-sm font-bold text-slate-900 truncate">{r.profiles_requester?.full_name || 'A player'}</span>
              {r.pro_id && r.profiles_pro && (
                <span className="text-xs text-slate-400 truncate">→ {r.profiles_pro.full_name}</span>
              )}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wide
              ${r.status === 'pending' ? 'text-amber-700' : r.status === 'accepted' ? 'text-emerald-700' : 'text-slate-400'}`}>
              {r.status}
            </span>
          </div>
          {r.message && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{r.message}</p>}
          <div className="flex items-center justify-between mt-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-3">
              {r.preferred_date && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(r.preferred_date).toLocaleDateString()}</span>}
              <span>{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.status === 'pending' && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setStatus(r.id, 'declined')} className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 px-2 py-1">Decline</button>
                <button onClick={() => setStatus(r.id, 'accepted')} className="text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md px-2.5 py-1">Accept</button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
