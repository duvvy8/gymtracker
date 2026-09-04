import { formatGrams } from '../lib/nutrition';

/**
 * The one-line protein/carbs/fat summary used in both list views.
 *
 * Each figure and its unit are held together with whitespace-nowrap, so a
 * narrow column breaks the line at a separator rather than stranding a
 * lone "g" on the next row.
 */
export function MacroSummary({
  protein,
  carbs,
  fat,
  className = '',
}: {
  protein: number;
  carbs: number;
  fat: number;
  className?: string;
}) {
  return (
    <p className={`numeric text-xs text-ink-2 ${className}`}>
      <span className="whitespace-nowrap">P {formatGrams(protein)}</span>
      <span aria-hidden="true"> · </span>
      <span className="whitespace-nowrap">C {formatGrams(carbs)}</span>
      <span aria-hidden="true"> · </span>
      <span className="whitespace-nowrap">F {formatGrams(fat)} g</span>
    </p>
  );
}
