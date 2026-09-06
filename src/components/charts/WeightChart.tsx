import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { chartAxis, chartGrid, chartTooltip, token } from '../../lib/chartTheme';
import { ChartCanvas } from './ChartCanvas';
import type { WeightPoint } from '../../lib/history';
import type { WeightUnit } from '../../types';

/**
 * Body weight over time.
 *
 * The y axis is padded rather than zero based. Day to day body weight moves
 * by a fraction of a percent, and anchoring the axis at zero would flatten
 * every real change into a straight line.
 */
export function WeightChart({ series, unit }: { series: WeightPoint[]; unit: WeightUnit }) {
  const values = series.map((point) => point.weight);
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const padding = Math.max((highest - lowest) * 0.2, 0.5);
  const label = `Body weight in ${unit} across ${series.length} readings, from ${lowest} to ${highest}.`;

  return (
    <ChartCanvas ariaLabel={label}>
      {({ width, height }) => (
        // Named for the same reason as the calorie chart: Recharts makes the
        // <svg> a tab stop with role="application".
        <LineChart
          aria-label={label}
          width={width}
          height={height}
          data={series}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="label" {...chartAxis} minTickGap={28} />
          <YAxis
            {...chartAxis}
            width={44}
            domain={[
              Math.round((lowest - padding) * 10) / 10,
              Math.round((highest + padding) * 10) / 10,
            ]}
            tickFormatter={(value: number) => value.toFixed(1)}
          />
          <Tooltip
            {...chartTooltip}
            formatter={(value) => [`${Number(value ?? 0)} ${unit}`, 'Weight']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke={token('color-weight')}
            strokeWidth={2}
            dot={{ r: 2.5, fill: token('color-weight'), strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      )}
    </ChartCanvas>
  );
}
