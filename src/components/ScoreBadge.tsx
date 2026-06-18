'use client';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const deg = Math.round((score / 10) * 360);
  const dims = size === 'sm'
    ? { outer: 'w-14 h-14', inner: 'w-11 h-11', scoreSize: 'text-lg', labelSize: 'text-[0.5rem]' }
    : { outer: 'w-[78px] h-[78px]', inner: 'w-[62px] h-[62px]', scoreSize: 'text-2xl', labelSize: 'text-[0.62rem]' };

  return (
    <div
      className={`${dims.outer} rounded-full grid place-items-center`}
      style={{ background: `conic-gradient(var(--mint) ${deg}deg, var(--line) 0)` }}
    >
      <div className={`${dims.inner} rounded-full bg-card grid place-items-center font-heading font-bold leading-none`}>
        <div className="text-center">
          <span className={dims.scoreSize}>{score}</span>
          <small className={`${dims.labelSize} text-muted block`}>/10</small>
        </div>
      </div>
    </div>
  );
}
