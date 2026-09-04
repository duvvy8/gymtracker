import { dayRange, formatShortDate } from './date';
import { kgToDisplay } from './nutrition';
import type { BodyWeightLog, FoodLog, IsoDate, WeightUnit } from '../types';

/** One day on the charts. */
export interface DailyPoint {
  date: IsoDate;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** False for a day with no entries, which is different from a day at zero. */
  logged: boolean;
}

/**
 * Totals for every day in the window, including days with nothing logged.
 *
 * Empty days are kept in the series so the x axis stays evenly spaced and a
 * gap in the record reads as a gap rather than being silently closed up.
 * They carry logged: false so averages can exclude them.
 */
export function buildDailySeries(
  logs: readonly FoodLog[],
  endDate: IsoDate,
  days: number,
): DailyPoint[] {
  const totals = new Map<
    IsoDate,
    { calories: number; protein: number; carbs: number; fat: number }
  >();

  for (const log of logs) {
    const current = totals.get(log.date) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    current.calories += log.calories;
    current.protein += log.protein;
    current.carbs += log.carbs;
    current.fat += log.fat;
    totals.set(log.date, current);
  }

  return dayRange(endDate, days).map((date) => {
    const entry = totals.get(date);
    return {
      date,
      label: formatShortDate(date),
      calories: Math.round(entry?.calories ?? 0),
      protein: Math.round(entry?.protein ?? 0),
      carbs: Math.round(entry?.carbs ?? 0),
      fat: Math.round(entry?.fat ?? 0),
      logged: entry !== undefined,
    };
  });
}

export interface SeriesSummary {
  daysLogged: number;
  daysInRange: number;
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
}

/** Averages over the days that actually have entries, not over the window. */
export function summariseDaily(series: readonly DailyPoint[]): SeriesSummary {
  const logged = series.filter((point) => point.logged);
  const mean = (pick: (point: DailyPoint) => number) =>
    logged.length === 0
      ? 0
      : Math.round(logged.reduce((total, point) => total + pick(point), 0) / logged.length);

  return {
    daysLogged: logged.length,
    daysInRange: series.length,
    averageCalories: mean((point) => point.calories),
    averageProtein: mean((point) => point.protein),
    averageCarbs: mean((point) => point.carbs),
    averageFat: mean((point) => point.fat),
  };
}

export interface WeightPoint {
  date: IsoDate;
  label: string;
  weight: number;
}

/** Weight readings inside the window, converted to the display unit. */
export function buildWeightSeries(
  weights: readonly BodyWeightLog[],
  unit: WeightUnit,
): WeightPoint[] {
  return weights
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      date: entry.date,
      label: formatShortDate(entry.date),
      weight: Math.round(kgToDisplay(entry.weightKg, unit) * 10) / 10,
    }));
}

export interface WeightSummary {
  readings: number;
  first: number | null;
  latest: number | null;
  change: number | null;
}

export function summariseWeight(series: readonly WeightPoint[]): WeightSummary {
  const first = series[0]?.weight ?? null;
  const latest = series[series.length - 1]?.weight ?? null;

  return {
    readings: series.length,
    first,
    latest,
    change: first !== null && latest !== null ? Math.round((latest - first) * 10) / 10 : null,
  };
}

/**
 * Collapses a daily series into 7 day blocks of daily averages.
 *
 * Ninety separate bars are unreadable on a phone, roughly three pixels
 * each. Averaging by week keeps the same span legible at any width, and
 * averaging over the logged days within each block means a week with two
 * missed days is not reported as a low week.
 */
export function toWeeklySeries(series: readonly DailyPoint[]): DailyPoint[] {
  const weeks: DailyPoint[] = [];

  for (let start = 0; start < series.length; start += 7) {
    const block = series.slice(start, start + 7);
    const logged = block.filter((point) => point.logged);
    const first = block[0];
    const last = block[block.length - 1];
    if (!first || !last) continue;

    const mean = (pick: (point: DailyPoint) => number) =>
      logged.length === 0
        ? 0
        : Math.round(logged.reduce((total, point) => total + pick(point), 0) / logged.length);

    weeks.push({
      date: first.date,
      label: first.label,
      calories: mean((point) => point.calories),
      protein: mean((point) => point.protein),
      carbs: mean((point) => point.carbs),
      fat: mean((point) => point.fat),
      logged: logged.length > 0,
    });
  }

  return weeks;
}

/**
 * The ranges offered on the History page.
 *
 * 91 rather than 90 days so the long range divides into exactly 13 whole
 * weeks with no ragged final block.
 */
export const HISTORY_RANGES = [
  { days: 7, label: '7 days', grouping: 'day' },
  { days: 30, label: '30 days', grouping: 'day' },
  { days: 91, label: '13 weeks', grouping: 'week' },
] as const;

export type HistoryRange = (typeof HISTORY_RANGES)[number];
export type HistoryRangeDays = HistoryRange['days'];
