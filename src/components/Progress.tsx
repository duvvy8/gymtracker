export type MetricTone = 'energy' | 'protein' | 'carb' | 'fat';

const FILL_CLASS: Record<MetricTone, string> = {
  energy: 'bg-energy',
  protein: 'bg-protein',
  carb: 'bg-carb',
  fat: 'bg-fat',
};

/**
 * Progress toward a daily target.
 *
 * Going past the target rescales the bar so the target sits where the
 * colours change and the excess is drawn beyond it. The overflow segment is
 * neutral graphite rather than red: exceeding a protein target is not an
 * error, and reusing the error colour here would make the four bars say
 * different things with the same paint.
 *
 * Width is the one inline style in the application. It is a computed
 * percentage, never user content, and a continuously variable length cannot
 * be expressed as a utility class.
 */
export function ProgressBar({
  value,
  target,
  tone,
  label,
  unit,
  size = 'md',
}: {
  value: number;
  target: number;
  tone: MetricTone;
  label: string;
  unit: string;
  size?: 'md' | 'lg';
}) {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
  const safeTarget = Number.isFinite(target) && target > 0 ? target : 0;

  const scale = Math.max(safeValue, safeTarget, 1);
  const withinTarget = (Math.min(safeValue, safeTarget) / scale) * 100;
  const beyondTarget = (Math.max(0, safeValue - safeTarget) / scale) * 100;

  const height = size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(safeTarget)}
      aria-valuenow={Math.round(safeValue)}
      aria-valuetext={`${Math.round(safeValue)} of ${Math.round(safeTarget)} ${unit}`}
      className={`flex w-full overflow-hidden rounded-sm bg-sunken ${height}`}
    >
      <div className={FILL_CLASS[tone]} style={{ width: `${withinTarget}%` }} />
      {beyondTarget > 0 ? <div className="bg-ink-2" style={{ width: `${beyondTarget}%` }} /> : null}
    </div>
  );
}
