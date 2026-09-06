import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, listBodyWeightsBetween, listLogsBetween } from '../db/queries';
import { addDays, todayIso } from '../lib/date';
import {
  buildDailySeries,
  buildWeightSeries,
  HISTORY_RANGES,
  summariseDaily,
  summariseWeight,
  toWeeklySeries,
  type HistoryRangeDays,
} from '../lib/history';
import { formatCalories } from '../lib/nutrition';
import { CalorieChart } from '../components/charts/CalorieChart';
import { MacroChart } from '../components/charts/MacroChart';
import { WeightChart } from '../components/charts/WeightChart';
import { Stat, StatGrid } from '../components/Stat';
import { Card, CardHeader, EmptyState, LinkButton, PageHeader } from '../components/ui';

export function HistoryPage() {
  const [rangeDays, setRangeDays] = useState<HistoryRangeDays>(30);

  const today = todayIso();
  const startDate = addDays(today, -(rangeDays - 1));
  const range = HISTORY_RANGES.find((option) => option.days === rangeDays) ?? HISTORY_RANGES[1];

  const settings = useLiveQuery(() => getSettings(), []);
  const logs = useLiveQuery(() => listLogsBetween(startDate, today), [startDate, today]);
  const weights = useLiveQuery(() => listBodyWeightsBetween(startDate, today), [startDate, today]);

  const dailySeries = useMemo(
    () => buildDailySeries(logs ?? [], today, rangeDays),
    [logs, today, rangeDays],
  );
  const chartSeries = useMemo(
    () => (range.grouping === 'week' ? toWeeklySeries(dailySeries) : dailySeries),
    [dailySeries, range.grouping],
  );
  const summary = useMemo(() => summariseDaily(dailySeries), [dailySeries]);

  const weightUnit = settings?.weightUnit ?? 'kg';
  const weightSeries = useMemo(
    () => buildWeightSeries(weights ?? [], weightUnit),
    [weights, weightUnit],
  );
  const weightSummary = useMemo(() => summariseWeight(weightSeries), [weightSeries]);

  const hasFoodData = summary.daysLogged > 0;
  const perLabel = range.grouping === 'week' ? 'Daily average within each week' : 'Per day';

  return (
    <>
      <PageHeader
        title="History"
        description="Review your calories, macros, and body weight over time."
        actions={
          <div
            role="group"
            aria-label="Time range"
            className="flex overflow-hidden rounded-md border border-line-input"
          >
            {HISTORY_RANGES.map((option, index) => (
              <button
                key={option.days}
                type="button"
                aria-pressed={option.days === rangeDays}
                onClick={() => setRangeDays(option.days)}
                className={`h-11 px-3 text-sm font-medium transition-colors ${
                  index > 0 ? 'border-l border-line-input' : ''
                } ${
                  option.days === rangeDays
                    ? 'bg-accent text-white'
                    : 'bg-surface text-ink-2 hover:bg-sunken'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-5">
        <Card>
          <CardHeader
            title="Calories"
            description={`${perLabel}, against your ${formatCalories(settings?.calorieTarget ?? 0)} kcal target`}
          />
          <div className="p-4 sm:p-5">
            {hasFoodData ? (
              <>
                <StatGrid columns={3}>
                  <Stat
                    label="Average"
                    value={formatCalories(summary.averageCalories)}
                    unit="kcal"
                  />
                  <Stat
                    label="Target"
                    value={formatCalories(settings?.calorieTarget ?? 0)}
                    unit="kcal"
                  />
                  <Stat
                    label="Days logged"
                    value={`${summary.daysLogged}`}
                    unit={`of ${summary.daysInRange}`}
                  />
                </StatGrid>
                <div className="mt-5">
                  <CalorieChart series={chartSeries} target={settings?.calorieTarget ?? 0} />
                </div>
              </>
            ) : (
              <EmptyState
                title="Nothing logged in this period"
                action={
                  <LinkButton to="/log" variant="primary">
                    Log food
                  </LinkButton>
                }
              >
                Once you have logged a few days, the chart will show how each day compares to your
                target.
              </EmptyState>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Macros" description={`${perLabel}, in grams`} />
          <div className="p-4 sm:p-5">
            {hasFoodData ? (
              <>
                <StatGrid columns={3}>
                  <Stat
                    label="Average protein"
                    value={summary.averageProtein}
                    unit="g"
                    tone="protein"
                  />
                  <Stat label="Average carbs" value={summary.averageCarbs} unit="g" tone="carb" />
                  <Stat label="Average fat" value={summary.averageFat} unit="g" tone="fat" />
                </StatGrid>
                <div className="mt-5">
                  <MacroChart series={chartSeries} />
                </div>
              </>
            ) : (
              <EmptyState title="No macro data yet">
                Macros appear here as soon as there are entries in this period.
              </EmptyState>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Body weight"
            description={`Readings in this period, in ${weightUnit}`}
          />
          <div className="p-4 sm:p-5">
            {weightSeries.length >= 2 ? (
              <>
                <StatGrid columns={3}>
                  <Stat
                    label="Latest"
                    value={weightSummary.latest ?? 0}
                    unit={weightUnit}
                    tone="weight"
                  />
                  <Stat
                    label="Change over the period"
                    value={
                      weightSummary.change === null
                        ? '0'
                        : `${weightSummary.change > 0 ? '+' : ''}${weightSummary.change}`
                    }
                    unit={weightUnit}
                    tone="weight"
                  />
                  <Stat label="Readings" value={weightSummary.readings} />
                </StatGrid>
                <div className="mt-5">
                  <WeightChart series={weightSeries} unit={weightUnit} />
                </div>
              </>
            ) : (
              <EmptyState
                title={
                  weightSeries.length === 1
                    ? 'One reading in this period'
                    : 'No weight readings in this period'
                }
                action={
                  <LinkButton to="/settings" variant="primary">
                    Record your weight
                  </LinkButton>
                }
              >
                A trend needs at least two readings. Weight is recorded on the Settings page.
              </EmptyState>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
