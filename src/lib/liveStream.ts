/**
 * Live stream client helpers.
 *
 * Wraps Supabase Realtime channels for:
 *  - new chat messages
 *  - heart-tap bursts
 *  - presence-based viewer count
 *  - session updates (featured product change, ended, etc.)
 */
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface LiveStreamMessage {
  id: string;
  session_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: { id: string; full_name: string; profile_picture_url: string | null };
}

export interface LiveStreamProduct {
  session_id: string;
  product_id: string;
  display_order: number;
  is_featured: boolean;
  units_sold: number;
  product?: {
    id: string;
    title: string;
    price_cents: number;
    image_url: string | null;
    brand: string | null;
    affiliate_url: string | null;
  };
}

/**
 * Subscribe to a stream. Returns a channel object — call .unsubscribe() on cleanup.
 */
export function subscribeToStream(
  sessionId: string,
  handlers: {
    onMessage?: (m: LiveStreamMessage) => void;
    onLike?: (likeRowId: string) => void;
    onSessionUpdate?: (changes: Record<string, unknown>) => void;
    onPresenceSync?: (viewerCount: number) => void;
  }
): RealtimeChannel {
  const ch = supabase.channel(`live:${sessionId}`, {
    config: { presence: { key: crypto.randomUUID() } },
  });

  if (handlers.onMessage) {
    ch.on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'live_stream_messages', filter: `session_id=eq.${sessionId}` },
      (payload) => handlers.onMessage!(payload.new as LiveStreamMessage)
    );
  }
  if (handlers.onLike) {
    ch.on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'live_stream_likes', filter: `session_id=eq.${sessionId}` },
      (payload) => handlers.onLike!((payload.new as any).id)
    );
  }
  if (handlers.onSessionUpdate) {
    ch.on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'pro_live_sessions', filter: `id=eq.${sessionId}` },
      (payload) => handlers.onSessionUpdate!(payload.new as Record<string, unknown>)
    );
  }
  if (handlers.onPresenceSync) {
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      const viewerCount = Object.keys(state).length;
      handlers.onPresenceSync!(viewerCount);
    });
  }

  ch.subscribe(async (status) => {
    if (status === 'SUBSCRIBED' && handlers.onPresenceSync) {
      await ch.track({ joined_at: new Date().toISOString() });
    }
  });

  return ch;
}

export async function sendMessage(sessionId: string, body: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false as const, error: 'not signed in' };
  const trimmed = body.trim().slice(0, 280);
  if (!trimmed) return { ok: false as const, error: 'empty' };
  const { error } = await supabase.from('live_stream_messages').insert({
    session_id: sessionId, user_id: u.user.id, body: trimmed,
  });
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

/**
 * Heart tap. Inserts a row — Realtime fans it out to other viewers so everyone
 * sees the floating heart animation in sync. Throttled client-side to 10/sec.
 */
let lastLikeAt = 0;
export async function tapHeart(sessionId: string) {
  const now = Date.now();
  if (now - lastLikeAt < 100) return { ok: false as const, error: 'rate' };
  lastLikeAt = now;
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false as const, error: 'not signed in' };
  const { error } = await supabase.from('live_stream_likes').insert({
    session_id: sessionId, user_id: u.user.id,
  });
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

/**
 * Recent messages on connect (catch-up so a newly-joining viewer sees the last
 * 30 messages, then Realtime streams new ones).
 */
export async function fetchRecentMessages(sessionId: string, limit = 30) {
  const { data, error } = await supabase
    .from('live_stream_messages')
    .select('id, session_id, user_id, body, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  // Hydrate authors (two-step — user_id refs auth.users)
  const ids = Array.from(new Set((data || []).map((r) => r.user_id))).filter(Boolean);
  const profMap = new Map<string, any>();
  if (ids.length) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, profile_picture_url')
      .in('id', ids);
    for (const p of profs || []) profMap.set(p.id, p);
  }
  return (data || []).reverse().map((m) => ({ ...m, profiles: profMap.get(m.user_id) }));
}

export async function fetchStreamProducts(sessionId: string): Promise<LiveStreamProduct[]> {
  const { data, error } = await supabase
    .from('live_stream_products')
    .select(`
      session_id, product_id, display_order, is_featured, units_sold,
      product:pro_products(id, title, price_cents, image_url, brand, affiliate_url)
    `)
    .eq('session_id', sessionId)
    .order('display_order', { ascending: true });
  if (error) return [];
  return (data as any[]) as LiveStreamProduct[];
}
