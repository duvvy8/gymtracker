import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, listLogsForDate, recentFoods, saveFoodLog } from '../db/queries';
import { describeDate, formatFullDate } from '../lib/date';
import { isValidationError } from '../lib/validation';
import { formatCalories, scaleFood, sumMacros } from '../lib/nutrition';
import { ROUTES } from '../lib/routeMeta';
import { useAppStore } from '../lib/store';
import { DailySummary } from '../components/DailySummary';
import { DateStepper } from '../components/DateStepper';
import { FoodLogList } from '../components/FoodLogList';
import { LogEntryDialog } from '../components/LogEntryDialog';
import { Card, CardHeader, EmptyState, LinkButton, PageHeader } from '../components/ui';
import type { Food, FoodLog } from '../types';

type DialogSubject = { food?: Food; log?: FoodLog } | null;

/** What one tap on a quick-add button logs: a whole serving, by weight when known. */
function defaultAmount(food: Food): { amount: number; unit: 'g' | 'serving'; label: string } {
  return food.servingGrams && food.servingGrams > 0
    ? { amount: food.servingGrams, unit: 'g', label: `${food.servingGrams} g` }
    : { amount: 1, unit: 'serving', label: food.servingLabel };
}

export function TodayPage() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const showNotice = useAppStore((state) => state.showNotice);
  const [subject, setSubject] = useState<DialogSubject>(null);
  const [quickLogging, setQuickLogging] = useState<number | null>(null);

  const settings = useLiveQuery(() => getSettings(), []);
  const logs = useLiveQuery(() => listLogsForDate(selectedDate), [selectedDate]);
  const recent = useLiveQuery(() => recentFoods(8), []);

  const totals = sumMacros(logs ?? []);
  const heading = describeDate(selectedDate);
  const fullDate = formatFullDate(selectedDate);
  const hasFoods = (recent?.length ?? 0) > 0;

  /**
   * One tap logs a whole serving. The entry appears in the list below
   * immediately and can be edited or removed from there, which is a faster
   * correction than making everybody confirm an amount they usually accept.
   */
  async function quickLog(food: Food) {
    if (food.id === undefined || quickLogging !== null) return;
    const { amount, unit, label } = defaultAmount(food);
    const macros = scaleFood(food, amount, unit);
    if (!macros) return;

    setQuickLogging(food.id);
    try {
      await saveFoodLog({
        date: selectedDate,
        foodId: food.id,
        amount,
        unit,
        name: food.name,
        ...(food.brand ? { brand: food.brand } : {}),
        servingLabel: food.servingLabel,
        ...macros,
      });
      showNotice(`${food.name} logged, ${label}.`);
    } catch (cause) {
      showNotice(
        isValidationError(cause) ? cause.message : 'That could not be logged. Try again.',
        'error',
      );
    } finally {
      setQuickLogging(null);
    }
  }

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
            <p role="status" className="text-sm text-ink-3">
              Loading your targets.
            </p>
          </Card>
        )}

        <Card>
          <CardHeader
            title={hasFoods ? 'Quick add' : 'Start your food log'}
            description={hasFoods ? 'One tap logs a serving' : undefined}
            actions={
              hasFoods ? (
                <LinkButton to={ROUTES.log.path} variant="primary">
                  Log food
                </LinkButton>
              ) : undefined
            }
          />
          {recent === undefined ? (
            <p role="status" className="px-4 py-8 text-center text-sm text-ink-3 sm:px-5">
              Loading your recent foods.
            </p>
          ) : recent.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-4 sm:p-5">
              {recent.map((food) => {
                const { label } = defaultAmount(food);
                return (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => void quickLog(food)}
                    disabled={quickLogging !== null}
                    className="flex min-h-11 max-w-full flex-col items-start rounded-md border border-line-input bg-surface px-3 py-1.5 text-left transition-colors hover:bg-sunken disabled:bg-sunken disabled:text-ink-3"
                  >
                    <span className="max-w-full wrap-anywhere text-sm font-medium text-ink">
                      {food.name}
                    </span>
                    <span className="numeric max-w-full wrap-anywhere text-xs text-ink-3">
                      {formatCalories(food.calories)} kcal / {label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No saved foods yet"
              action={
                <LinkButton to={ROUTES.log.path} variant="primary">
                  Add your first food
                </LinkButton>
              }
            >
              gymtracker keeps a food list of your own, stored in this browser. Add a food once, by
              hand or by scanning its barcode, and afterwards it is one tap to log.
            </EmptyState>
          )}
        </Card>

        {hasFoods || logs === undefined || logs.length > 0 ? (
          <Card>
            <CardHeader
              title="Entries"
              description={
                logs && logs.length > 0
                  ? `${logs.length} ${logs.length === 1 ? 'entry' : 'entries'} on this day`
                  : undefined
              }
              actions={
                logs && logs.length > 0 ? (
                  <LinkButton to={ROUTES.history.path} size="sm">
                    See history
                  </LinkButton>
                ) : undefined
              }
            />
            <FoodLogList
              logs={logs ?? []}
              loading={logs === undefined}
              onEdit={(log) => setSubject({ log })}
              onDeleted={(message) => showNotice(message)}
              emptyAction={
                <LinkButton to={ROUTES.log.path} variant="primary">
                  Log food
                </LinkButton>
              }
            />
          </Card>
        ) : null}
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
