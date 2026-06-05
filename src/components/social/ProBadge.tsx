interface Props {
  isPro?: boolean | null;
  /** xs = inline next to a name; sm = chip on profile */
  size?: 'xs' | 'sm';
  className?: string;
}

/**
 * Tiny "Pro" badge — shown next to a user's name in feed, comments, etc.
 * Renders nothing when isPro is falsy, so callers can drop it in unconditionally.
 */
export default function ProBadge({ isPro, size = 'xs', className = '' }: Props) {
  if (!isPro) return null;
  const sz = size === 'xs'
    ? 'px-1 py-px text-[8px] tracking-[0.08em]'
    : 'px-1.5 py-0.5 text-[10px] tracking-[0.1em]';
  return (
    <span
      className={`inline-flex items-center rounded-md bg-gradient-to-b from-amber-100 to-amber-200 text-amber-900 font-extrabold uppercase ring-1 ring-amber-300/60 align-middle ${sz} ${className}`}
      title="PaddleGrid Pro"
    >
      Pro
    </span>
  );
}
