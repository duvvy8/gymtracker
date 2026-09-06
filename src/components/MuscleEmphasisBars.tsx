import type { MuscleEmphasis } from '../types';

export function MuscleEmphasisBars({ items }: { items: readonly MuscleEmphasis[] }) {
  return (
    <div className="grid gap-2" aria-label="Approximate muscle emphasis">
      {items.map((item) => (
        <div key={item.muscle}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className={item.role === 'primary' ? 'font-medium text-ink' : 'text-ink-2'}>
              {item.muscle}
            </span>
            <span className="numeric shrink-0 text-ink-3">{item.percent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-sm bg-sunken" aria-hidden="true">
            <div
              className={item.role === 'primary' ? 'h-full bg-accent' : 'h-full bg-line-input'}
              style={{ width: `${item.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
