import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, listLogsForDate, recentFoods } from '../db/queries';
import { describeDate, formatFullDate } from '../lib/date';
import { formatCalories, sumMacros } from '../lib/nutrition';
import { useAppStore } from '../lib/store';
import { DailySummary } from '../components/DailySummary';
import { DateStepper } from '../components/DateStepper';
import { FoodLogList } from '../components/FoodLogList';
import { LogEntryDialog } from '../components/LogEntryDialog';
import { Card, CardHeader, EmptyState, LinkButton, PageHeader } from '../components/ui';
import type { Food, FoodLog } from '../types';

type DialogSubject = { food?: Food; log?: FoodLog } | null;

export function TodayPage() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const showNotice = useAppStore((state) => state.showNotice);
  const [subject, setSubject] = useState<DialogSubject>(null);

  const settings = useLiveQuery(() => getSettings(), []);
  const logs = useLiveQuery(() => listLogsForDate(selectedDate), [selectedDate]);
  const recent = useLiveQuery(() => recentFoods(8), []);

  const totals = sumMacros(logs ?? []);
  const heading = describeDate(selectedDate);
  const fullDate = formatFullDate(selectedDate);

  return (
    <>
      <PageHeader
        title={heading}
        description={heading === fullDate ? undefined : fullDate}
        actions={<DateStepper />}
      />

      <div className="grid gap-5">
        {settings ? (
          <DailySummary totals={totals} settings={settings} />
        ) : (
          <Card className="p-5">
            <p className="text-sm text-ink-3">Loading your targets.</p>
          </Card>
        )}

        <Card>
          <CardHeader
            title="Quick add"
            description="Foods you logged most recently"
            actions={
              <LinkButton to="/log" variant="primary">
                Log food
              </LinkButton>
            }
          />
          {recent && recent.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-4 sm:p-5">
              {recent.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => setSubject({ food })}
                  className="flex min-h-11 max-w-full flex-col items-start rounded-md border border-line-input bg-surface px-3 py-1.5 text-left transition-colors hover:bg-sunken"
                >
                  <span className="max-w-full truncate text-sm font-medium text-ink">
                    {food.name}
                  </span>
                  <span className="numeric text-xs text-ink-3">
                    {formatCalories(food.calories)} kcal / {food.servingLabel}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nothing logged yet"
              action={
                <LinkButton to="/log" variant="primary">
                  Add your first food
                </LinkButton>
              }
            >
              Foods you add will show up here so you can log them again in one tap.
            </EmptyState>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Entries"
            description={
              logs && logs.length > 0
                ? `${logs.length} ${logs.length === 1 ? 'entry' : 'entries'} on this day`
                : undefined
            }
          />
          <FoodLogList
            logs={logs ?? []}
            onEdit={(log) => setSubject({ log })}
            onDeleted={(message) => showNotice(message)}
            emptyAction={
              <LinkButton to="/log" variant="primary">
                Log food
              </LinkButton>
            }
          />
        </Card>
      </div>

      <LogEntryDialog
        open={subject !== null}
        onClose={() => setSubject(null)}
        date={selectedDate}
        {...(subject?.food ? { food: subject.food } : {})}
        {...(subject?.log ? { log: subject.log } : {})}
        onSaved={(message) => showNotice(message)}
      />
    </>
  );
}
