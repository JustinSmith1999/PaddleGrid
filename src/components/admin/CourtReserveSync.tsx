import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Download, Clock, Activity, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CourtReserveSyncProps {
  facilityId: string;
}

interface SyncLog {
  id: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  status: 'running' | 'success' | 'error';
  blocks_created: number;
  blocks_skipped: number;
  total_reservations: number;
  bookings_created?: number;
  bookings_skipped?: number;
  error_message: string | null;
}

export default function CourtReserveSync({ facilityId }: CourtReserveSyncProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncingPricing, setSyncingPricing] = useState(false);
  const [pricingSyncResult, setPricingSyncResult] = useState<any>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSyncLogs();

    const subscription = supabase
      .channel('sync_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courtreserve_sync_logs',
          filter: `facility_id=eq.${facilityId}`,
        },
        () => {
          loadSyncLogs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [facilityId]);

  const loadSyncLogs = async () => {
    const { data } = await supabase
      .from('courtreserve_sync_logs')
      .select('*')
      .eq('facility_id', facilityId)
      .order('sync_started_at', { ascending: false })
      .limit(5);

    if (data) {
      setSyncLogs(data);
    }
    setLoading(false);
  };

  const syncSchedule = async () => {
    setSyncing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/courtreserve-sync?facility_id=${facilityId}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync schedule');
      }

      loadSyncLogs();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const syncPricing = async () => {
    setSyncingPricing(true);
    setPricingSyncResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/courtreserve-pricing-sync?facility_id=${facilityId}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync pricing');
      }

      setPricingSyncResult(data);
      setTimeout(() => setPricingSyncResult(null), 10000);
    } catch (error) {
      console.error('Pricing sync error:', error);
      setPricingSyncResult({ success: false, error: error.message });
    } finally {
      setSyncingPricing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const latestSync = syncLogs[0];
  const isRunning = latestSync?.status === 'running';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" />
            CourtReserve Auto-Sync
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Automatically syncs reservations every 15 minutes
          </p>
        </div>
      </div>

      {latestSync && (
        <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isRunning && (
                <>
                  <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sync in progress...</p>
                    <p className="text-xs text-gray-600">
                      Started {formatDate(latestSync.sync_started_at)}
                    </p>
                  </div>
                </>
              )}

              {latestSync.status === 'success' && (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last sync successful</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(latestSync.sync_completed_at || latestSync.sync_started_at)}
                    </p>
                  </div>
                </>
              )}

              {latestSync.status === 'error' && (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last sync failed</p>
                    <p className="text-xs text-red-600">
                      {latestSync.error_message || 'Unknown error'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {latestSync.status === 'success' && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {latestSync.bookings_created || 0} bookings
                </p>
                <p className="text-xs text-gray-600">
                  {latestSync.blocks_created} blocks
                </p>
                <p className="text-xs text-gray-500">
                  {latestSync.total_reservations} total
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={syncSchedule}
            disabled={syncing || isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${syncing || isRunning ? 'animate-spin' : ''}`} />
            {syncing || isRunning ? 'Syncing...' : 'Manual Sync'}
          </button>

          <button
            onClick={syncPricing}
            disabled={syncingPricing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <DollarSign className={`w-4 h-4 ${syncingPricing ? 'animate-spin' : ''}`} />
            {syncingPricing ? 'Syncing Pricing...' : 'Sync Court Prices'}
          </button>
        </div>

        {pricingSyncResult && (
          <div className={`p-4 rounded-lg border ${
            pricingSyncResult.success
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {pricingSyncResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  pricingSyncResult.success ? 'text-emerald-900' : 'text-red-900'
                }`}>
                  {pricingSyncResult.success
                    ? 'Court pricing updated successfully'
                    : 'Failed to sync pricing'
                  }
                </p>
                {pricingSyncResult.success && pricingSyncResult.stats && (
                  <div className="mt-2 text-xs text-emerald-700 space-y-1">
                    <p>Updated {pricingSyncResult.stats.courts_updated} court prices from CourtReserve</p>
                    {pricingSyncResult.stats.courts_skipped > 0 && (
                      <p>{pricingSyncResult.stats.courts_skipped} courts skipped (no pricing data)</p>
                    )}
                  </div>
                )}
                {pricingSyncResult.error && (
                  <p className="mt-1 text-xs text-red-700">{pricingSyncResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {syncLogs.length > 1 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Sync History
            </h4>
            <div className="space-y-2">
              {syncLogs.slice(1, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-xs p-2 rounded bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {log.status === 'success' && (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    )}
                    {log.status === 'error' && (
                      <AlertCircle className="w-3 h-3 text-red-600" />
                    )}
                    {log.status === 'running' && (
                      <Activity className="w-3 h-3 text-blue-600" />
                    )}
                    <span className="text-gray-600">
                      {formatDate(log.sync_started_at)}
                    </span>
                  </div>
                  {log.status === 'success' && (
                    <span className="text-gray-700">
                      {log.bookings_created || 0} bookings, {log.blocks_created} blocks
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-200">
          <p className="font-medium">How auto-sync works:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Automatically runs every 15 minutes</li>
            <li>Fetches reservations from CourtReserve for the next 30 days</li>
            <li>Creates booking records linked to users by email</li>
            <li>Creates availability blocks to prevent double-booking</li>
            <li>Matches courts by name automatically</li>
            <li>Skips bookings and blocks that already exist</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
