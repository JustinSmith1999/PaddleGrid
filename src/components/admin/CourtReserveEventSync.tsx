import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Calendar, Clock, Activity, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CourtReserveEventSyncProps {
  facilityId: string;
}

interface EventSyncLog {
  id: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  status: 'running' | 'success' | 'error';
  events_created: number;
  events_updated: number;
  events_skipped: number;
  occurrences_created: number;
  registrations_synced: number;
  total_events_fetched: number;
  error_message: string | null;
}

export default function CourtReserveEventSync({ facilityId }: CourtReserveEventSyncProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<EventSyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSyncLogs();

    const subscription = supabase
      .channel('event_sync_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courtreserve_event_sync_logs',
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
      .from('courtreserve_event_sync_logs')
      .select('*')
      .eq('facility_id', facilityId)
      .order('sync_started_at', { ascending: false })
      .limit(5);

    if (data) {
      setSyncLogs(data);
    }
    setLoading(false);
  };

  const syncEvents = async () => {
    setSyncing(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = `${supabaseUrl}/functions/v1/courtreserve-event-sync?facility_id=${facilityId}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync events');
      }

      loadSyncLogs();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
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
            <Calendar className="w-5 h-5 text-blue-600" />
            CourtReserve Event Sync
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Sync events, clinics, tournaments, and registrations
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
                  {latestSync.events_created + latestSync.events_updated} events
                </p>
                <p className="text-xs text-gray-600">
                  {latestSync.registrations_synced} registrations
                </p>
              </div>
            )}
          </div>

          {latestSync.status === 'success' && (
            <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-xs text-gray-600">Created</p>
                <p className="text-sm font-medium text-green-600">{latestSync.events_created}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Updated</p>
                <p className="text-sm font-medium text-blue-600">{latestSync.events_updated}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Occurrences</p>
                <p className="text-sm font-medium text-purple-600">{latestSync.occurrences_created}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Players</p>
                <p className="text-sm font-medium text-orange-600">{latestSync.registrations_synced}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={syncEvents}
          disabled={syncing || isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${syncing || isRunning ? 'animate-spin' : ''}`} />
          {syncing || isRunning ? 'Syncing Events...' : 'Sync Events Now'}
        </button>

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
                    <div className="flex items-center gap-3">
                      <span className="text-gray-700">
                        {log.events_created + log.events_updated} events
                      </span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {log.registrations_synced}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-200">
          <p className="font-medium">What gets synced:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>All events, clinics, tournaments, and leagues</li>
            <li>Event details including dates, times, and pricing</li>
            <li>Court assignments and capacity limits</li>
            <li>Participant registrations and payment status</li>
            <li>Updates existing events instead of duplicating</li>
          </ul>
          <p className="font-medium mt-3">Important:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Synced events are read-only in PaddleGrid</li>
            <li>Make changes in CourtReserve, then sync again</li>
            <li>New participants are auto-created as players</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
