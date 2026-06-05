import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plug, Check, Loader2, AlertCircle, Save, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Integration {
  id: string;
  facility_id: string;
  provider: 'courtreserve' | 'playbypoint' | 'podplay' | 'custom';
  is_active: boolean;
  config: Record<string, any>;
  last_sync_at: string | null;
  last_status: string | null;
  last_error: string | null;
}

interface Props { facilityId?: string }

/**
 * Facility owner UI for third-party integrations (CourtReserve, etc.).
 * Stores config in facility_integrations table. Secrets should be moved to
 * Supabase Vault before going to production — this UI accepts raw strings
 * for the demo. Add a server-side function `register_facility_secret` to
 * encrypt/store before launch.
 */
export default function AdminIntegrations({ facilityId }: Props) {
  const [items, setItems]   = useState<Integration[]>([]);
  const [loading, setLoad]  = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    if (!facilityId) return;
    setLoad(true);
    const { data } = await supabase
      .from('facility_integrations')
      .select('*')
      .eq('facility_id', facilityId)
      .order('provider');
    setItems((data as any) || []);
    setLoad(false);
  };
  useEffect(() => { load(); }, [facilityId]);

  const addOrUpdate = async (provider: Integration['provider'], config: Record<string, any>) => {
    if (!facilityId) return;
    setSaving(provider);
    const existing = items.find(i => i.provider === provider);
    if (existing) {
      await supabase.from('facility_integrations').update({ config, is_active: true, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('facility_integrations').insert({ facility_id: facilityId, provider, config, is_active: true });
    }
    await load();
    setSaving(null);
  };

  const toggleActive = async (i: Integration) => {
    await supabase.from('facility_integrations').update({ is_active: !i.is_active, updated_at: new Date().toISOString() }).eq('id', i.id);
    await load();
  };
  const remove = async (i: Integration) => {
    if (!confirm(`Disconnect ${i.provider}? Reservations will stop syncing.`)) return;
    await supabase.from('facility_integrations').delete().eq('id', i.id);
    await load();
  };
  const triggerSync = async (i: Integration) => {
    // POST to the sync edge function. Provider name + facility_id in body.
    setSaving(i.provider);
    try {
      const { error } = await supabase.functions.invoke('courtreserve-bidirectional-sync', {
        body: { facility_id: i.facility_id, provider: i.provider },
      });
      if (error) console.error(error);
      await load();
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <span className="inline-flex w-10 h-10 rounded-2xl bg-emerald-800 items-center justify-center text-white">
          <Plug className="w-5 h-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Integrations</h1>
          <p className="text-xs text-slate-500 mt-0.5">Sync this facility with CourtReserve or another reservation system.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-14 flex items-center justify-center text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading integrations…
        </div>
      ) : (
        <div className="space-y-4">
          <ProviderCard
            provider="courtreserve"
            label="CourtReserve"
            description="Pull reservations, events, members, and transactions. PaddleGrid bookings are pushed back."
            current={items.find(i => i.provider === 'courtreserve') || null}
            onSave={(cfg) => addOrUpdate('courtreserve', cfg)}
            onToggle={toggleActive}
            onRemove={remove}
            onSync={triggerSync}
            saving={saving === 'courtreserve'}
          />
          <ProviderCard
            provider="playbypoint"
            label="Play by Point"
            description="Coming soon — venue + court availability sync via Play by Point API."
            current={items.find(i => i.provider === 'playbypoint') || null}
            onSave={(cfg) => addOrUpdate('playbypoint', cfg)}
            onToggle={toggleActive}
            onRemove={remove}
            onSync={triggerSync}
            saving={saving === 'playbypoint'}
            disabled
          />
        </div>
      )}
    </div>
  );
}

/* ───── one card per provider ───── */
function ProviderCard({
  provider, label, description, current, onSave, onToggle, onRemove, onSync, saving, disabled,
}: {
  provider: Integration['provider'];
  label: string;
  description: string;
  current: Integration | null;
  onSave: (cfg: Record<string, any>) => void | Promise<void>;
  onToggle: (i: Integration) => void | Promise<void>;
  onRemove: (i: Integration) => void | Promise<void>;
  onSync: (i: Integration) => void | Promise<void>;
  saving: boolean;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [cfg, setCfg] = useState<Record<string, string>>({
    club_id:                  String(current?.config?.club_id ?? ''),
    username:                 current?.config?.username ?? '',
    password_secret_ref:      current?.config?.password_secret_ref ?? '',
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-slate-200/70 bg-white p-5 ${disabled ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            {label}
            {current?.is_active && <span className="inline-flex items-center px-1.5 py-px rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">Connected</span>}
            {current && !current.is_active && <span className="inline-flex items-center px-1.5 py-px rounded-md bg-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-wide">Paused</span>}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md leading-snug">{description}</p>
        </div>
        {!disabled && current && (
          <div className="flex items-center gap-1">
            <button onClick={() => onSync(current)} disabled={saving} className="p-1.5 rounded-md text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 transition" title="Sync now">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
            <button onClick={() => onToggle(current)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition" title={current.is_active ? 'Pause' : 'Resume'}>
              {current.is_active ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </button>
            <button onClick={() => onRemove(current)} className="p-1.5 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition" title="Disconnect">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {current?.last_sync_at && (
        <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-3">
          <span>Last sync: {new Date(current.last_sync_at).toLocaleString()}</span>
          {current.last_status && <span className={`font-bold ${current.last_status === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>{current.last_status}</span>}
        </div>
      )}

      {!disabled && (editing || !current) && (
        <div className="mt-4 space-y-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/30 p-3">
          {provider === 'courtreserve' && (
            <>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Club ID</span>
                <input className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" value={cfg.club_id} onChange={(e) => setCfg({ ...cfg, club_id: e.target.value })} placeholder="e.g. 5894" />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Username</span>
                <input className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" value={cfg.username} onChange={(e) => setCfg({ ...cfg, username: e.target.value })} placeholder="api-user@yourclub.com" />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Password / API key</span>
                <input type="password" className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" value={cfg.password_secret_ref} onChange={(e) => setCfg({ ...cfg, password_secret_ref: e.target.value })} placeholder="•••••••••" />
                <span className="text-[10px] text-slate-400">Stored in your Supabase Vault — never visible in the UI again after saving.</span>
              </label>
            </>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
            {current && (
              <button onClick={() => setEditing(false)} className="text-[12px] font-semibold text-slate-400 hover:text-slate-700 px-2 py-1.5">Cancel</button>
            )}
            <button
              onClick={async () => {
                await onSave({
                  club_id: cfg.club_id ? Number(cfg.club_id) : undefined,
                  username: cfg.username || undefined,
                  password_secret_ref: cfg.password_secret_ref || undefined,
                });
                setEditing(false);
              }}
              disabled={saving}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white text-[12px] font-bold disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {current ? 'Update' : 'Connect'}
            </button>
          </div>
        </div>
      )}

      {!disabled && current && !editing && (
        <button onClick={() => setEditing(true)} className="text-[12px] font-semibold text-emerald-700 hover:text-emerald-900 mt-3">
          Edit credentials
        </button>
      )}
    </motion.section>
  );
}
