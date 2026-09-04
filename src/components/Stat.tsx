import type { ReactNode } from 'react';

export type StatTone = 'ink' | 'protein' | 'carb' | 'fat' | 'weight';

const TONE_CLASS: Record<StatTone, string> = {
  ink: 'text-ink',
  protein: 'text-protein',
  carb: 'text-carb',
  fat: 'text-fat',
  weight: 'text-weight',
};

/**
 * A single figure with its label.
 *
 * These carry the same numbers the charts draw, in text. That is what makes
 * the charts' role="img" honest: the underlying values are readable without
 * interpreting a graphic.
 */
export function Stat({
  label,
  value,
  unit,
  tone = 'ink',
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: StatTone;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className={`numeric mt-0.5 text-xl font-semibold ${TONE_CLASS[tone]}`}>
        {value}
        {unit ? <span className="text-sm font-normal text-ink-3"> {unit}</span> : null}
      </dd>
    </div>
  );
}

export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  return (
    <dl className={`grid grid-cols-2 gap-4 ${columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
      {children}
    </dl>
  );
}
