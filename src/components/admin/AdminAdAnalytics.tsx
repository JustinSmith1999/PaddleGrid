import { useEffect, useState } from 'react';
import { BarChart3, MousePointer2, Eye, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Row {
  id: string;
  location: string;
  priority: number;
  impressions: number;
  clicks: number;
  sponsor: { id: string; name: string; logo_url: string | null };
}

export default function AdminAdAnalytics({ facilityId }: { facilityId?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      let q = supabase
        .from('sponsor_placements')
        .select(`id, location, priority, impressions, clicks, sponsor:sponsors!sponsor_placements_sponsor_id_fkey(id, name, logo_url)`)
        .order('impressions', { ascending: false })
        .limit(40);
      if (facilityId) q = q.eq('facility_id', facilityId);
      const { data } = await q;
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, [facilityId]);

  const totals = rows.reduce((acc, r) => ({ imp: acc.imp + (r.impressions||0), clk: acc.clk + (r.clicks||0) }), { imp: 0, clk: 0 });
  const ctr = totals.imp > 0 ? (totals.clk / totals.imp * 100) : 0;

  return (
    <div className="px-4 sm:px-6 py-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <span className="inline-flex w-10 h-10 rounded-2xl bg-emerald-800 items-center justify-center text-white"><BarChart3 className="w-5 h-5" /></span>
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Ad performance</h1>
          <p className="text-xs text-slate-500 mt-0.5">Impressions, clicks, and CTR across your sponsor placements.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="Impressions" value={totals.imp.toLocaleString()} icon={<Eye className="w-4 h-4" />} />
            <StatCard label="Clicks" value={totals.clk.toLocaleString()} icon={<MousePointer2 className="w-4 h-4" />} />
            <StatCard label="CTR" value={`${ctr.toFixed(2)}%`} icon={<BarChart3 className="w-4 h-4" />} />
          </div>

          {rows.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-10">No active placements yet.</p>
          ) : (
            <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2">Sponsor</th>
                    <th className="text-left px-3 py-2">Location</th>
                    <th className="text-right px-3 py-2">Impressions</th>
                    <th className="text-right px-3 py-2">Clicks</th>
                    <th className="text-right px-3 py-2">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const rowCtr = r.impressions > 0 ? (r.clicks / r.impressions * 100) : 0;
                    return (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 flex items-center gap-2">
                          {r.sponsor?.logo_url && <img src={r.sponsor.logo_url} alt="" className="w-5 h-5 rounded" />}
                          <span className="font-bold text-slate-800">{r.sponsor?.name || '—'}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{r.location}</td>
                        <td className="px-3 py-2 text-right font-semibold">{(r.impressions || 0).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-semibold">{(r.clicks || 0).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`font-bold ${rowCtr >= 2 ? 'text-emerald-700' : 'text-slate-500'}`}>{rowCtr.toFixed(2)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1">{icon} {label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    </div>
  );
}
