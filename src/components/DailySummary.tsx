import { formatCalories, formatGrams } from '../lib/nutrition';
import { ProgressBar, type MetricTone } from './Progress';
import { Card } from './ui';
import type { Macros, Settings } from '../types';

const MACRO_TEXT_CLASS: Record<MetricTone, string> = {
  energy: 'text-energy',
  protein: 'text-protein',
  carb: 'text-carb',
  fat: 'text-fat',
};

function MacroCell({
  label,
  tone,
  value,
  target,
}: {
  label: string;
  tone: MetricTone;
  value: number;
  target: number;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className={`text-sm font-semibold ${MACRO_TEXT_CLASS[tone]}`}>{label}</span>
        <span className="numeric truncate text-sm text-ink-2">
          {formatGrams(value)}
          <span className="text-ink-3"> / {formatGrams(target)} g</span>
        </span>
      </div>
      <ProgressBar value={value} target={target} tone={tone} label={label} unit="grams" />
    </div>
  );
}

/**
 * The day's totals against the saved targets.
 *
 * Calories lead because that is the figure most people check first. The
 * macro rows use the same bar so the four numbers can be compared at a
 * glance rather than each having its own visual language.
 */
export function DailySummary({ totals, settings }: { totals: Macros; settings: Settings }) {
  const remaining = settings.calorieTarget - totals.calories;
  const isOver = remaining < 0;

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-5">
        <p className="eyebrow mb-2">Calories</p>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="numeric text-3xl font-semibold text-ink sm:text-4xl">
            {formatCalories(totals.calories)}
          </span>
          <span className="numeric text-lg text-ink-3">
            / {formatCalories(settings.calorieTarget)} kcal
          </span>
        </div>

        <div className="mt-3">
          <ProgressBar
            value={totals.calories}
            target={settings.calorieTarget}
            tone="energy"
            label="Calories"
            unit="kilocalories"
            size="lg"
          />
        </div>

        <p className={`mt-2 text-sm ${isOver ? 'font-medium text-danger' : 'text-ink-2'}`}>
          {isOver
            ? `${formatCalories(Math.abs(remaining))} kcal over target`
            : `${formatCalories(remaining)} kcal left`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        <MacroCell
          label="Protein"
          tone="protein"
          value={totals.protein}
          target={settings.proteinTarget}
        />
        <MacroCell label="Carbs" tone="carb" value={totals.carbs} target={settings.carbTarget} />
        <MacroCell label="Fat" tone="fat" value={totals.fat} target={settings.fatTarget} />
      </div>
    </Card>
  );
}
