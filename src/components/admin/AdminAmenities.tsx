import { useEffect, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props { facilityId?: string }

const ALL_AMENITIES = [
  'Indoor courts','Outdoor courts','Showers','Locker rooms','Pro shop',
  'Café','Bar','Lounge','Wifi','Free parking','Ball machine','Lessons available',
  'Open play','Tournaments hosted','Junior programs','Junior camps','Wheelchair accessible',
  'Stringing service','Equipment rental','Childcare','Stretching area','Sauna','Cold plunge',
];

export default function AdminAmenities({ facilityId }: Props) {
  const [active, setActive] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!facilityId) return;
    setLoading(true);
    const { data } = await supabase.from('facility_amenities').select('name').eq('facility_id', facilityId);
    setActive(new Set(((data as any) || []).map((r: any) => r.name)));
    setLoading(false);
  };
  useEffect(() => { void load(); }, [facilityId]);

  const toggle = async (name: string) => {
    if (!facilityId) return;
    setSaving(true);
    const next = new Set(active);
    if (next.has(name)) {
      next.delete(name);
      await supabase.from('facility_amenities').delete().eq('facility_id', facilityId).eq('name', name);
    } else {
      next.add(name);
      await supabase.from('facility_amenities').upsert({ facility_id: facilityId, name }, { onConflict: 'facility_id,name' });
    }
    setActive(next);
    setSaving(false);
  };

  const addCustom = async () => {
    const v = custom.trim();
    if (!v || active.has(v)) return;
    await toggle(v);
    setCustom('');
  };

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Amenities</h1>
      <p className="text-xs text-slate-500 mb-5">Tap to add or remove. Visible on the public club page so people know what to expect.</p>

      {loading ? (
        <div className="py-10 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {ALL_AMENITIES.map(name => {
              const on = active.has(name);
              return (
                <button key={name} onClick={() => toggle(name)} disabled={saving}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${on ? 'bg-emerald-800 text-white ring-1 ring-emerald-800' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}>
                  {name}
                </button>
              );
            })}
          </div>

          {Array.from(active).filter(n => !ALL_AMENITIES.includes(n)).length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">Custom amenities</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(active).filter(n => !ALL_AMENITIES.includes(n)).map(name => (
                  <span key={name} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-800 text-white">
                    {name}
                    <button onClick={() => toggle(name)} className="opacity-70 hover:opacity-100"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add custom amenity…" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <button onClick={addCustom} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-800 text-white text-sm font-bold">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </>
      )}
    </div>
  );
}
