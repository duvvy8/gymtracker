import { formatDayLabel, todayIso } from '../lib/date';
import { useAppStore } from '../lib/store';
import { IconChevronLeft, IconChevronRight } from './icons';
import { Button } from './ui';

/** Moves the selected day back and forward, with a way back to today. */
export function DateStepper() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const shiftSelectedDate = useAppStore((state) => state.shiftSelectedDate);
  const goToToday = useAppStore((state) => state.goToToday);

  const isToday = selectedDate === todayIso();

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Button size="icon" onClick={() => shiftSelectedDate(-1)} aria-label="Previous day">
        <IconChevronLeft />
      </Button>

      <p className="numeric min-w-0 flex-1 truncate text-center text-sm font-medium text-ink sm:w-28 sm:flex-none">
        {formatDayLabel(selectedDate)}
      </p>

      <Button size="icon" onClick={() => shiftSelectedDate(1)} aria-label="Next day">
        <IconChevronRight />
      </Button>

      <Button size="sm" onClick={goToToday} disabled={isToday}>
        Today
      </Button>
    </div>
  );
}
