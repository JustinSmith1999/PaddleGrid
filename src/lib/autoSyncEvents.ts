import { supabase } from './supabase';

const SYNC_INTERVAL_MS = 60 * 60 * 1000;
const LAST_SYNC_KEY = 'courtreserve_events_last_sync';
const FACILITY_ID = 'bfb8aa81-fca9-48d9-b697-d13bba78430e';

export async function autoSyncEventsIfNeeded() {
  const lastSyncStr = localStorage.getItem(LAST_SYNC_KEY);
  const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;
  const now = Date.now();

  if (now - lastSync < SYNC_INTERVAL_MS) {
    return;
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const apiUrl = `${supabaseUrl}/functions/v1/courtreserve-event-sync?facility_id=${FACILITY_ID}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      localStorage.setItem(LAST_SYNC_KEY, now.toString());
    }
  } catch (error) {
    console.error('Auto-sync error:', error);
  }
}

export async function forceSyncEvents() {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const apiUrl = `${supabaseUrl}/functions/v1/courtreserve-event-sync?facility_id=${FACILITY_ID}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const now = Date.now();
      localStorage.setItem(LAST_SYNC_KEY, now.toString());
      return await response.json();
    }

    throw new Error('Sync failed');
  } catch (error) {
    console.error('Force sync error:', error);
    throw error;
  }
}
