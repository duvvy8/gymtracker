import { Bar, BarChart, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { chartAxis, chartGrid, chartTooltip, token } from '../../lib/chartTheme';
import { formatCalories } from '../../lib/nutrition';
import { ChartCanvas } from './ChartCanvas';
import type { DailyPoint } from '../../lib/history';

/** Fewer x labels as the window grows, so they never collide. */
function tickGapFor(pointCount: number): number {
  if (pointCount <= 10) return 4;
  if (pointCount <= 35) return 24;
  return 48;
}

export function CalorieChart({ series, target }: { series: DailyPoint[]; target: number }) {
  const label =
    `Daily calories over ${series.length} days, against a target of ` +
    `${formatCalories(target)} kilocalories.`;

  return (
    <ChartCanvas ariaLabel={label}>
      {({ width, height }) => (
        <BarChart
          width={width}
          height={height}
          data={series}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="label" {...chartAxis} minTickGap={tickGapFor(series.length)} />
          <YAxis
            {...chartAxis}
            width={44}
            tickFormatter={(value: number) => (value >= 1000 ? `${value / 1000}k` : String(value))}
          />
          <Tooltip
            {...chartTooltip}
            formatter={(value) => [`${formatCalories(Number(value ?? 0))} kcal`, 'Calories']}
          />
          <ReferenceLine
            y={target}
            stroke={token('color-danger')}
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
          />
          <Bar
            dataKey="calories"
            fill={token('color-energy')}
            radius={[2, 2, 0, 0]}
            maxBarSize={44}
            isAnimationActive={false}
          />
        </BarChart>
      )}
    </ChartCanvas>
  );
}
