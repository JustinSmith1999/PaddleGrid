import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PresencePayload {
  user_id: string;
  online_at: string;
  full_name?: string;
  avatar_url?: string | null;
}

interface UsePresenceArgs {
  /** Channel scope — `club:<id>`, `feed`, etc. Stable per-page. */
  channel: string;
  /** Current user identity to broadcast. */
  me: { id: string; full_name?: string; avatar_url?: string | null } | null;
  /** When false, the channel is not joined (e.g. before auth). */
  enabled?: boolean;
}

/**
 * Supabase Realtime presence — broadcasts you to the channel,
 * returns the live list of other people on the same channel.
 *
 * Returns:
 *   • count   — total presences (incl. you)
 *   • peers   — array of {user_id, online_at, full_name, avatar_url}
 *               excluding yourself
 */
export function usePresence({ channel, me, enabled = true }: UsePresenceArgs) {
  const [count, setCount] = useState(0);
  const [peers, setPeers] = useState<PresencePayload[]>([]);

  useEffect(() => {
    if (!enabled || !me?.id) return;

    const ch = supabase.channel(channel, {
      config: { presence: { key: me.id } },
    });

    const refresh = () => {
      const state = ch.presenceState() as Record<string, PresencePayload[]>;
      const flat = Object.values(state).flat();
      setCount(flat.length);
      setPeers(flat.filter((p) => p.user_id !== me.id));
    };

    ch.on('presence', { event: 'sync' },  refresh)
      .on('presence', { event: 'join' },  refresh)
      .on('presence', { event: 'leave' }, refresh)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({
            user_id:    me.id,
            online_at:  new Date().toISOString(),
            full_name:  me.full_name,
            avatar_url: me.avatar_url,
          });
        }
      });

    return () => { ch.unsubscribe(); };
  }, [channel, me?.id, enabled]);

  return { count, peers };
}
