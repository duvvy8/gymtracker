import type { IsoDate } from '../types';

/**
 * Dates are handled in the user's local timezone throughout.
 *
 * Using UTC would shift "today" for anyone west of Greenwich in the evening,
 * so a meal logged at 9pm could land on tomorrow's total. Every conversion
 * below goes through the local-time Date constructor for that reason.
 */

export function toIsoDate(value: Date): IsoDate {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

export function fromIsoDate(iso: IsoDate): Date {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = fromIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Monday-based start of the week containing `iso`. */
export function startOfWeek(iso: IsoDate): IsoDate {
  const date = fromIsoDate(iso);
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return toIsoDate(date);
}

/** The `count` days ending on `endIso`, oldest first. */
export function dayRange(endIso: IsoDate, count: number): IsoDate[] {
  const days: IsoDate[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    days.push(addDays(endIso, -offset));
  }
  return days;
}

export function daysBetween(fromIso: IsoDate, toIsoValue: IsoDate): number {
  const ms = fromIsoDate(toIsoValue).getTime() - fromIsoDate(fromIso).getTime();
  return Math.round(ms / 86400000);
}

const dayMonth = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const weekdayDayMonth = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const fullDate = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** "4 Sep" */
export function formatShortDate(iso: IsoDate): string {
  return dayMonth.format(fromIsoDate(iso));
}

/** "Thu 4 Sep" */
export function formatDayLabel(iso: IsoDate): string {
  return weekdayDayMonth.format(fromIsoDate(iso));
}

/** "Thursday, 4 September 2026" */
export function formatFullDate(iso: IsoDate): string {
  return fullDate.format(fromIsoDate(iso));
}

/** "Today", "Yesterday", "Tomorrow", or the full date. */
export function describeDate(iso: IsoDate, reference: IsoDate = todayIso()): string {
  const delta = daysBetween(reference, iso);
  if (delta === 0) return 'Today';
  if (delta === -1) return 'Yesterday';
  if (delta === 1) return 'Tomorrow';
  return formatFullDate(iso);
}
