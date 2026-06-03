import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, MousePointerClick, Eye, Megaphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Sponsor {
  id: string;
  facility_id: string | null;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  background_image_url: string | null;
  brand_color: string | null;
  cta_label: string | null;
  cta_url: string | null;
  is_active: boolean;
}

interface Placement {
  id: string;
  sponsor_id: string;
  facility_id: string | null;
  location: string;
  start_at: string;
  end_at: string | null;
  priority: number;
  impressions: number;
  clicks: number;
  sponsors?: Sponsor;
}

const LOCATIONS: { value: string; label: string }[] = [
  { value: 'feed_top', label: 'Feed — top' },
  { value: 'play_top', label: 'Play — top' },
  { value: 'community_top', label: 'Community — top' },
  { value: 'me_top', label: 'Me — top' },
  { value: 'shop_top', label: 'Shop — top' },
  { value: 'bookings_top', label: 'Bookings — top' },
  { value: 'profile_top', label: 'Profile — top' },
  { value: 'messages_top', label: 'Messages — top' },
  { value: 'leaderboard_top', label: 'Leaderboard — top' },
  { value: 'event_detail_top', label: 'Event detail — top' },
  { value: 'global_banner', label: 'Global banner (every page)' },
];

export default function AdminSponsors({ facilityId }: { facilityId?: string }) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('sponsors').select('*').order('created_at', { ascending: false }),
      supabase.from('sponsor_placements').select('*, sponsors(name, logo_url)').order('priority', { ascending: false }),
    ]);
    setSponsors((s as Sponsor[]) || []);
    setPlacements((p as unknown as Placement[]) || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const totalImpressions = placements.reduce((s, p) => s + (p.impressions || 0), 0);
  const totalClicks = placements.reduce((s, p) => s + (p.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 1000) / 10 : 0;

  const saveSponsor = async (draft: Partial<Sponsor> & { id?: string }) => {
    if (draft.id) {
      await supabase.from('sponsors').update({
        name: draft.name, tagline: draft.tagline, logo_url: draft.logo_url,
        background_image_url: draft.background_image_url, brand_color: draft.brand_color,
        cta_label: draft.cta_label, cta_url: draft.cta_url, is_active: draft.is_active,
      }).eq('id', draft.id);
    } else {
      await supabase.from('sponsors').insert({
        facility_id: facilityId ?? null,
        name: draft.name, tagline: draft.tagline ?? null, logo_url: draft.logo_url ?? null,
        background_image_url: draft.background_image_url ?? null,
        brand_color: draft.brand_color ?? '#2D4A38',
        cta_label: draft.cta_label ?? null, cta_url: draft.cta_url ?? null,
        is_active: draft.is_active ?? true,
      });
    }
    setEditing(null);
    setShowNew(false);
    await load();
  };

  const deleteSponsor = async (id: string) => {
    if (!confirm('Delete this sponsor and all its placements?')) return;
    await supabase.from('sponsors').delete().eq('id', id);
    await load();
  };

  const addPlacement = async (sponsorId: string, location: string) => {
    await supabase.from('sponsor_placements').insert({
      sponsor_id: sponsorId, facility_id: facilityId ?? null, location,
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 60 * 86400000).toISOString(),
      priority: 5,
    });
    await load();
  };

  const deletePlacement = async (id: string) => {
    await supabase.from('sponsor_placements').delete().eq('id', id);
    await load();
  };

  return (
    <div className="space-y-5 p-5 sm:p-7 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Manrope',serif" }}>Sponsors</h1>
          <p className="text-sm text-slate-500 mt-1">Place sponsors at the top of any page. Impressions and clicks tracked automatically.</p>
        </div>
        <button
          onClick={() => { setShowNew(true); setEditing({ id: '', name: '', tagline: '', logo_url: '', background_image_url: '', brand_color: '#2D4A38', cta_label: '', cta_url: '', is_active: true, facility_id: facilityId ?? null }); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition"
        >
          <Plus className="w-4 h-4" />
          New Sponsor
        </button>
      </div>

      {/* Rollup */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Sponsors</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{sponsors.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 inline-flex items-center gap-1.5"><Eye className="w-3 h-3" /> Impressions</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalImpressions.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 inline-flex items-center gap-1.5"><MousePointerClick className="w-3 h-3" /> Clicks · CTR</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalClicks.toLocaleString()} <span className="text-sm font-medium text-emerald-700">{ctr}%</span></div>
        </div>
      </div>

      {/* Editor */}
      {editing && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3">
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2"><Megaphone className="w-4 h-4 text-emerald-700" /> {showNew ? 'New sponsor' : 'Edit sponsor'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-700 space-y-1">Name<input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" value={editing.name ?? ''} onChange={e => setEditing({ ...editing, name: e.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-700 space-y-1">Brand color<input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" value={editing.brand_color ?? ''} onChange={e => setEditing({ ...editing, brand_color: e.target.value })} placeholder="#2D4A38" /></label>
            <label className="text-xs font-semibold text-slate-700 space-y-1 sm:col-span-2">Tagline<input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" value={editing.tagline ?? ''} onChange={e => setEditing({ ...editing, tagline: e.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-700 space-y-1">Logo URL<input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" value={editing.logo_url ?? ''} onChange={e => setEditing({ ...editing, logo_url: e.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-700 space-y-1">Background URL<input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" value={editing.background_image_url ?? ''} onChange={e => setEditing({ ...editing, background_image_url: e.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-700 space-y-1">CTA label<input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" value={editing.cta_label ?? ''} onChange={e => setEditing({ ...editing, cta_label: e.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-700 space-y-1">CTA URL<input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" value={editing.cta_url ?? ''} onChange={e => setEditing({ ...editing, cta_url: e.target.value })} /></label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => { setEditing(null); setShowNew(false); }} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button onClick={() => saveSponsor(editing)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition">Save</button>
          </div>
        </div>
      )}

      {/* Sponsors list */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 text-sm text-slate-400">Loading sponsors…</div>
      ) : (
        <div className="space-y-3">
          {sponsors.map(s => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 ring-1 ring-slate-200/60">
                  {s.logo_url && <img src={s.logo_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                    {!s.is_active && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">Inactive</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{s.tagline}</p>
                </div>
                <button onClick={() => setEditing(s)} className="p-2 rounded-lg hover:bg-slate-50 text-slate-500" title="Edit"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => deleteSponsor(s.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="border-t border-slate-100 px-4 sm:px-5 py-3 bg-slate-50/50">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Placements</div>
                <div className="flex flex-wrap items-center gap-2">
                  {placements.filter(p => p.sponsor_id === s.id).map(p => (
                    <div key={p.id} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-slate-200/60 text-xs">
                      <span className="font-semibold text-slate-700">{LOCATIONS.find(l => l.value === p.location)?.label || p.location}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500"><Eye className="w-3 h-3 inline mr-0.5" />{p.impressions}</span>
                      <span className="text-slate-500"><MousePointerClick className="w-3 h-3 inline mr-0.5" />{p.clicks}</span>
                      <button onClick={() => deletePlacement(p.id)} className="ml-1 text-slate-400 hover:text-rose-500" title="Remove placement"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <select
                    onChange={e => { if (e.target.value) { addPlacement(s.id, e.target.value); e.target.value = ''; } }}
                    className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 cursor-pointer"
                    defaultValue=""
                  >
                    <option value="">+ Add placement…</option>
                    {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
