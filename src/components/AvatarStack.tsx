interface StackedAvatar {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
}

interface Props {
  /** Up to `max` members shown as circles. Anything beyond becomes a +N chip. */
  members: StackedAvatar[];
  /** Full member count. Used to compute "+N" if larger than shown. */
  totalCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  max?: number;
  ringClass?: string;
  className?: string;
}

const SIZE = {
  xs: { box: 'w-5 h-5',  font: 'text-[9px]',  overlap: '-ml-1.5' },
  sm: { box: 'w-6 h-6',  font: 'text-[10px]', overlap: '-ml-2'   },
  md: { box: 'w-8 h-8',  font: 'text-[11px]', overlap: '-ml-2.5' },
  lg: { box: 'w-10 h-10',font: 'text-[12px]', overlap: '-ml-3'   },
};

function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

/**
 * Overlapping avatar stack — Linear/GitHub/Notion style.
 *
 * Pass up to `max` members; anything beyond `max` is summarised as
 * "+N more" using the difference between `totalCount` and `max`.
 */
export default function AvatarStack({
  members,
  totalCount,
  size = 'md',
  max = 3,
  ringClass = 'ring-2 ring-white',
  className = '',
}: Props) {
  const shown = members.slice(0, max);
  const remainder = Math.max(0, (totalCount ?? members.length) - shown.length);

  if (shown.length === 0 && remainder === 0) return null;

  const sz = SIZE[size];

  return (
    <div className={`inline-flex items-center ${className}`}>
      {shown.map((m, i) => (
        <span
          key={m.id}
          className={`${sz.box} rounded-full overflow-hidden ${ringClass} ${i > 0 ? sz.overlap : ''} relative flex-shrink-0 bg-slate-100 inline-block`}
          title={m.name || ''}
          style={{ zIndex: shown.length - i }}
        >
          {m.avatarUrl ? (
            <img src={m.avatarUrl} alt={m.name || ''} className="w-full h-full object-cover" />
          ) : (
            <span className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-bold ${sz.font}`}>
              {initials(m.name)}
            </span>
          )}
        </span>
      ))}
      {remainder > 0 && (
        <span
          className={`${sz.box} rounded-full ${ringClass} ${shown.length > 0 ? sz.overlap : ''} relative flex items-center justify-center bg-slate-100 text-slate-600 font-bold ${sz.font} flex-shrink-0`}
          style={{ zIndex: 0 }}
        >
          +{remainder}
        </span>
      )}
    </div>
  );
}
