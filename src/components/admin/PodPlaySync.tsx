import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Settings, Users, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PodPlayConfig {
  id: string;
  facility_id: string;
  podplay_facility_id: string;
  api_endpoint: string;
  sync_enabled: boolean;
  sync_bookings: boolean;
  sync_members: boolean;
  sync_events: boolean;
  auto_create_members: boolean;
  last_sync_at: string | null;
  sync_interval_minutes: number;
}

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  direction: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function PodPlaySync() {
  const { user } = useAuth();
  const [config, setConfig] = useState<PodPlayConfig | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [formData, setFormData] = useState({
    podplay_facility_id: '',
    api_key: '',
    api_endpoint: 'https://api.podplay.app/v1',
    webhook_secret: '',
    sync_enabled: true,
    sync_bookings: true,
    sync_members: true,
    sync_events: true,
    auto_create_members: true,
    sync_interval_minutes: 15,
  });

  useEffect(() => {
    loadConfig();
    loadSyncLogs();
  }, [user]);

  async function loadConfig() {
    try {
      const { data: facilityUser } = await supabase
        .from('facility_users')
        .select('facility_id')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .single();

      if (!facilityUser) return;

      const { data, error } = await supabase
        .from('podplay_facilities')
        .select('*')
        .eq('facility_id', facilityUser.facility_id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data);
        setFormData({
          podplay_facility_id: data.podplay_facility_id,
          api_key: '',
          api_endpoint: data.api_endpoint,
          webhook_secret: '',
          sync_enabled: data.sync_enabled,
          sync_bookings: data.sync_bookings,
          sync_members: data.sync_members,
          sync_events: data.sync_events,
          auto_create_members: data.auto_create_members,
          sync_interval_minutes: data.sync_interval_minutes,
        });
      }
    } catch (error) {
      console.error('Error loading PodPlay config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSyncLogs() {
    try {
      const { data: facilityUser } = await supabase
        .from('facility_users')
        .select('facility_id')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .single();

      if (!facilityUser) return;

      const { data: configData } = await supabase
        .from('podplay_facilities')
        .select('id')
        .eq('facility_id', facilityUser.facility_id)
        .single();

      if (!configData) return;

      const { data, error } = await supabase
        .from('podplay_sync_logs')
        .select('*')
        .eq('podplay_facility_id', configData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: facilityUser } = await supabase
        .from('facility_users')
        .select('facility_id')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .single();

      if (!facilityUser) throw new Error('Not authorized');

      const configData = {
        facility_id: facilityUser.facility_id,
        podplay_facility_id: formData.podplay_facility_id,
        api_key_encrypted: formData.api_key || config?.api_key_encrypted || '',
        api_endpoint: formData.api_endpoint,
        webhook_secret_encrypted: formData.webhook_secret || '',
        sync_enabled: formData.sync_enabled,
        sync_bookings: formData.sync_bookings,
        sync_members: formData.sync_members,
        sync_events: formData.sync_events,
        auto_create_members: formData.auto_create_members,
        sync_interval_minutes: formData.sync_interval_minutes,
      };

      if (config) {
        await supabase
          .from('podplay_facilities')
          .update(configData)
          .eq('id', config.id);
      } else {
        await supabase.from('podplay_facilities').insert(configData);
      }

      await loadConfig();
      setShowSettings(false);
      alert('PodPlay configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  }

  async function triggerSync() {
    setSyncing(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/podplay-auto-processor`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      await loadSyncLogs();
      await loadConfig();
      alert('Sync completed successfully!');
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Failed to trigger sync');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">PodPlay Integration</h2>
            <p className="text-sm text-slate-600 mt-1">
              Sync bookings, members, and events with PodPlay
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            {config && (
              <button
                onClick={triggerSync}
                disabled={syncing || !config.sync_enabled}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>

        {config ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-900">Status</div>
                  <div className="text-xs text-blue-700">
                    {config.sync_enabled ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {config.sync_enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-emerald-900">Last Sync</div>
                  <div className="text-xs text-emerald-700">
                    {config.last_sync_at
                      ? new Date(config.last_sync_at).toLocaleString()
                      : 'Never'}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-900">
                {config.last_sync_at
                  ? new Date(config.last_sync_at).toLocaleTimeString()
                  : 'N/A'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-purple-900">Sync Interval</div>
                  <div className="text-xs text-purple-700">Minutes</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {config.sync_interval_minutes}m
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-900 mb-1">
              PodPlay Not Configured
            </p>
            <p className="text-xs text-blue-700 mb-4">
              Configure your PodPlay integration to start syncing data
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Configure Now
            </button>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Configuration</h3>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                PodPlay Facility ID
              </label>
              <input
                type="text"
                value={formData.podplay_facility_id}
                onChange={(e) =>
                  setFormData({ ...formData, podplay_facility_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={config ? 'Leave blank to keep existing' : 'Enter API key'}
                required={!config}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                API Endpoint
              </label>
              <input
                type="text"
                value={formData.api_endpoint}
                onChange={(e) =>
                  setFormData({ ...formData, api_endpoint: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Webhook Secret (Optional)
              </label>
              <input
                type="password"
                value={formData.webhook_secret}
                onChange={(e) =>
                  setFormData({ ...formData, webhook_secret: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="For webhook signature verification"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sync Interval (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={formData.sync_interval_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sync_interval_minutes: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sync_enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, sync_enabled: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Enable Sync</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sync_bookings}
                  onChange={(e) =>
                    setFormData({ ...formData, sync_bookings: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Sync Bookings</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sync_members}
                  onChange={(e) =>
                    setFormData({ ...formData, sync_members: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Sync Members</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sync_events}
                  onChange={(e) =>
                    setFormData({ ...formData, sync_events: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Sync Events</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.auto_create_members}
                  onChange={(e) =>
                    setFormData({ ...formData, auto_create_members: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Auto-create Members
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Sync History</h3>
        <div className="space-y-2">
          {syncLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No sync history yet</div>
          ) : (
            syncLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {log.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : log.status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-slate-900 capitalize">
                      {log.sync_type} Sync
                    </div>
                    <div className="text-xs text-slate-600">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-900">
                    {log.records_processed} processed
                  </div>
                  <div className="text-xs text-slate-600">
                    {log.records_created} created, {log.records_updated} updated
                    {log.records_failed > 0 && `, ${log.records_failed} failed`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
