interface Props {
  isPro?: boolean | null;
  /** xs (14px) — inline next to names · sm (18px) — profile chip · md (24px) */
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const SIZE = {
  xs: { box: 'w-[15px] h-[15px]', icon: 'w-[9px] h-[9px]',  ring: 'ring-[1.5px]' },
  sm: { box: 'w-[20px] h-[20px]', icon: 'w-[12px] h-[12px]', ring: 'ring-2' },
  md: { box: 'w-[28px] h-[28px]', icon: 'w-[16px] h-[16px]', ring: 'ring-2' },
};

/**
 * PaddleGrid Pro badge — small forest-green disc with the paddle mark,
 * ringed in antique gold. Same "verified" gesture as a Twitter/Meta check,
 * but the silhouette is the brand mark, not a generic checkmark.
 *
 * Renders nothing when isPro is falsy.
 */
export default function ProBadge({ isPro, size = 'xs', className = '' }: Props) {
  if (!isPro) return null;
  const sz = SIZE[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full align-middle relative flex-shrink-0 ${sz.box} ${sz.ring} ring-amber-400/85 shadow-[0_1px_2px_rgba(22,41,30,0.25)] ${className}`}
      style={{ background: 'radial-gradient(120% 120% at 30% 25%, #1f3a2c 0%, #16291E 55%, #0c1812 100%)' }}
      title="PaddleGrid Pro"
      aria-label="PaddleGrid Pro"
    >
      <svg viewBox="0 0 24 24" className={sz.icon} fill="white" aria-hidden="true">
        {/* Paddle head */}
        <ellipse cx="12" cy="9.5" rx="6.5" ry="7" />
        {/* Handle with subtle wrap notch */}
        <path d="M10 14 h4 v7.2 a1.6 1.6 0 0 1 -4 0 Z" />
        {/* Tiny dot — the ball — peeks beside the paddle head */}
        <circle cx="20" cy="6.2" r="1.6" fill="#FCD34D" />
      </svg>
    </span>
  );
}
