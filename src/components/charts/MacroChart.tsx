import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { chartAxis, chartGrid, chartTooltip, token } from '../../lib/chartTheme';
import { ChartCanvas } from './ChartCanvas';
import type { DailyPoint } from '../../lib/history';

const SERIES = [
  { key: 'protein', name: 'Protein', colour: 'color-protein', swatch: 'bg-protein' },
  { key: 'carbs', name: 'Carbs', colour: 'color-carb', swatch: 'bg-carb' },
  { key: 'fat', name: 'Fat', colour: 'color-fat', swatch: 'bg-fat' },
] as const;

function tickGapFor(pointCount: number): number {
  if (pointCount <= 10) return 4;
  if (pointCount <= 35) return 24;
  return 48;
}

/**
 * Macros per day, stacked in grams.
 *
 * The legend is written as ordinary markup rather than using Recharts'
 * own, so it matches the type scale and the swatch colours come from the
 * same Tailwind utilities used everywhere else.
 */
export function MacroChart({ series }: { series: DailyPoint[] }) {
  const label = `Protein, carbohydrate and fat in grams per day over ${series.length} days.`;

  return (
    <>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {SERIES.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-sm text-ink-2">
            <span aria-hidden="true" className={`h-3 w-3 rounded-sm ${item.swatch}`} />
            {item.name}
          </li>
        ))}
      </ul>

      <ChartCanvas ariaLabel={label}>
        {({ width, height }) => (
          // Named for the same reason as the calorie chart: Recharts makes the
          // <svg> a tab stop with role="application".
          <BarChart
            aria-label={label}
            width={width}
            height={height}
            data={series}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid {...chartGrid} />
            <XAxis dataKey="label" {...chartAxis} minTickGap={tickGapFor(series.length)} />
            <YAxis {...chartAxis} width={40} tickFormatter={(value: number) => `${value}`} />
            <Tooltip
              {...chartTooltip}
              formatter={(value, name) => [`${Number(value ?? 0)} g`, String(name ?? '')]}
            />
            {SERIES.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.name}
                stackId="macros"
                fill={token(item.colour)}
                maxBarSize={44}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        )}
      </ChartCanvas>
    </>
  );
}
