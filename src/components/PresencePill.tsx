import { useAuth } from '../contexts/AuthContext';
import { usePresence } from '../hooks/usePresence';
import AvatarStack from './AvatarStack';

interface Props {
  /** Channel scope — e.g. `club:bfb8aa81-...` */
  channel: string;
  /** Tone of the pill — light works on cream surfaces, dark on photo hero */
  tone?: 'light' | 'dark';
  /** Singular noun (default "viewing") — e.g. "online", "active", "watching" */
  verb?: string;
}

/**
 * Tiny live "N people here right now" indicator.
 * Wired to Supabase Realtime presence — fades in once the channel sync arrives.
 */
export default function PresencePill({ channel, tone = 'light', verb = 'viewing' }: Props) {
  const { user, profile } = useAuth();
  const me = user ? {
    id: user.id,
    full_name: profile?.full_name || undefined,
    avatar_url: profile?.profile_picture_url || null,
  } : null;

  const { count, peers } = usePresence({ channel, me, enabled: !!me });
  if (count < 1) return null;

  const isDark = tone === 'dark';
  const wrap = isDark
    ? 'bg-black/30 backdrop-blur-md text-white ring-white/15'
    : 'bg-emerald-50 text-emerald-900 ring-emerald-200/60';
  const dot = isDark ? 'bg-emerald-300' : 'bg-emerald-600';

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full ring-1 ${wrap} text-[11px] font-semibold`}
      title={`${count} ${count === 1 ? 'person' : 'people'} ${verb}`}
    >
      <span className="relative flex w-2 h-2">
        <span className={`absolute inset-0 rounded-full ${dot} opacity-60 animate-ping`} />
        <span className={`relative w-2 h-2 rounded-full ${dot}`} />
      </span>
      <AvatarStack
        size="xs"
        max={3}
        ringClass={isDark ? 'ring-2 ring-black/30' : 'ring-2 ring-emerald-50'}
        members={peers.slice(0, 3).map(p => ({ id: p.user_id, name: p.full_name || null, avatarUrl: p.avatar_url || null }))}
        totalCount={count}
      />
      <span>{count} {verb}</span>
    </span>
  );
}
