import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  deleteMeal,
  listLogsForDate,
  listMealBundlesForDate,
  moveSnack,
  placeSnack,
  type MealWithComponents,
} from '../db/queries';
import { formatAmount, formatCalories, sumNutrients } from '../lib/nutrition';
import { useAppStore } from '../lib/store';
import type { NoticeTone } from '../lib/store';
import type { FoodLog, MealCategory } from '../types';
import { AddMealDialog } from '../components/AddMealDialog';
import { DateStepper } from '../components/DateStepper';
import { FoodLogList } from '../components/FoodLogList';
import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from '../components/icons';
import { MacroSummary } from '../components/MacroSummary';
import { LogEntryDialog } from '../components/LogEntryDialog';
import { Button, Card, CardHeader, EmptyState, LinkButton, PageHeader } from '../components/ui';

const categoryLabels: Record<Exclude<MealCategory, 'snack'>, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

function MealCard({
  bundle,
  onNotice,
}: {
  bundle: MealWithComponents;
  onNotice: (message: string, tone?: NoticeTone) => void;
}) {
  const { meal, components } = bundle;
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const total = sumNutrients(components);

  async function remove() {
    if (!meal.id || busy) return;
    setBusy(true);
    try {
      await deleteMeal(meal.id);
      onNotice(`${meal.name} removed.`);
    } catch {
      onNotice('That meal could not be removed. Try again.', 'error');
      setBusy(false);
    }
  }

  async function shift(direction: 'earlier' | 'later') {
    if (!meal.id) return;
    await moveSnack(meal.id, direction);
    onNotice(`${meal.name} moved ${direction}.`);
  }

  async function finishPointerDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (!meal.id) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-snack-slot]');
    const slot = Number(target?.dataset.snackSlot);
    if (slot >= 0 && slot <= 3) {
      await placeSnack(meal.id, slot as 0 | 1 | 2 | 3);
      onNotice(`${meal.name} moved.`);
    }
  }

  return (
    <article className="rounded-md border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink">{meal.name}</h3>
          <p className="mt-0.5 text-xs text-ink-3">
            {components.length} {components.length === 1 ? 'item' : 'items'} ·{' '}
            {formatCalories(total.calories)} kcal
          </p>
          <MacroSummary
            protein={total.protein}
            carbs={total.carbs}
            fat={total.fat}
            className="mt-1"
          />
        </div>
        <Button
          variant="quiet"
          size="icon"
          onClick={() => setConfirming(true)}
          aria-label={`Remove ${meal.name}`}
        >
          <IconTrash />
        </Button>
      </div>

      <ul className="mt-3 divide-y divide-line border-t border-line text-sm">
        {components.map((item) => (
          <li key={item.id} className="py-2">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="font-medium">{item.name}</span>
                <span className="block text-xs text-ink-3">
                  {formatAmount(item.amount, item.unit, item.servingLabel)}
                  {item.preparation ? ` · ${item.preparation}` : ''}
                </span>
              </span>
              <span className="numeric shrink-0">{formatCalories(item.calories)} kcal</span>
            </div>
            {item.uncertainty ? (
              <p className="mt-1 text-xs text-ink-3">Check: {item.uncertainty}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {meal.category === 'snack' ? (
        <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-line pt-3">
          <Button
            variant="quiet"
            size="sm"
            className="touch-none"
            onClick={() => void shift('earlier')}
            disabled={(meal.snackSlot ?? 3) === 0}
          >
            <IconArrowUp />
            Move earlier
          </Button>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => void shift('later')}
            disabled={(meal.snackSlot ?? 3) === 3}
          >
            <IconArrowDown />
            Move later
          </Button>
          <Button
            variant="quiet"
            size="sm"
            aria-label={`Drag ${meal.name} to another meal position`}
            onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
            onPointerUp={(event) => void finishPointerDrag(event)}
          >
            Drag
          </Button>
        </div>
      ) : null}

      {confirming ? (
        <div className="mt-3 rounded-md border border-line bg-sunken p-3">
          <p className="text-sm">Remove this meal and all of its items?</p>
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" onClick={() => setConfirming(false)} disabled={busy}>
              Keep it
            </Button>
            <Button size="sm" variant="danger" onClick={() => void remove()} disabled={busy}>
              {busy ? 'Removing' : 'Remove'}
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function MealSlot({
  label,
  slot,
  meals,
  onNotice,
}: {
  label: string;
  slot: 0 | 1 | 2 | 3;
  meals: MealWithComponents[];
  onNotice: (message: string, tone?: NoticeTone) => void;
}) {
  return (
    <section
      aria-label={label}
      data-snack-slot={slot}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const id = Number(event.dataTransfer.getData('text/plain'));
        if (Number.isInteger(id)) void placeSnack(id, slot);
      }}
      className="min-h-12 rounded-md border border-dashed border-line px-3 py-2"
    >
      <p className="eyebrow mb-2">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {meals.map((bundle) => (
          <MealCard key={bundle.meal.id} bundle={bundle} onNotice={onNotice} />
        ))}
      </div>
    </section>
  );
}

export function MealsPage() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const showNotice = useAppStore((state) => state.showNotice);
  const [adding, setAdding] = useState(false);
  const [editingLegacy, setEditingLegacy] = useState<FoodLog | null>(null);
  const bundles = useLiveQuery(() => listMealBundlesForDate(selectedDate), [selectedDate]);
  const logs = useLiveQuery(() => listLogsForDate(selectedDate), [selectedDate]);
  const legacy = (logs ?? []).filter((entry) => entry.mealId === undefined);

  const snacks = (bundles ?? []).filter((entry) => entry.meal.category === 'snack');
  const byCategory = (category: Exclude<MealCategory, 'snack'>) =>
    (bundles ?? []).filter((entry) => entry.meal.category === category);
  const atSlot = (slot: number) => snacks.filter((entry) => (entry.meal.snackSlot ?? 3) === slot);

  return (
    <>
      <PageHeader
        title="Meals"
        description="Your day in grouped meals. Add by photo, barcode, saved food, drink or manual entry."
        actions={<DateStepper />}
      />
      <div className="mb-5 flex flex-wrap justify-end gap-2">
        <LinkButton to="/foods">Manage saved foods</LinkButton>
        <Button variant="primary" onClick={() => setAdding(true)}>
          <IconPlus />
          Add meal
        </Button>
      </div>

      {bundles === undefined ? (
        <Card className="p-8">
          <p role="status" className="text-center text-sm text-ink-3">
            Loading meals.
          </p>
        </Card>
      ) : bundles.length === 0 && legacy.length === 0 ? (
        <Card>
          <EmptyState
            title="No meals for this day"
            action={
              <Button variant="primary" onClick={() => setAdding(true)}>
                <IconPlus />
                Add meal
              </Button>
            }
          >
            One saved meal can contain several foods and an optional drink.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4">
          <MealSlot
            label="Snacks before breakfast"
            slot={0}
            meals={atSlot(0)}
            onNotice={showNotice}
          />
          {(['breakfast', 'lunch', 'dinner'] as const).map((category, index) => (
            <div key={category} className="grid gap-4">
              <section>
                <h2 className="mb-2 text-lg font-semibold">{categoryLabels[category]}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {byCategory(category).length ? (
                    byCategory(category).map((bundle) => (
                      <MealCard key={bundle.meal.id} bundle={bundle} onNotice={showNotice} />
                    ))
                  ) : (
                    <p className="rounded-md border border-line bg-surface px-4 py-5 text-sm text-ink-3">
                      Nothing added.
                    </p>
                  )}
                </div>
              </section>
              {index < 2 ? (
                <MealSlot
                  label={
                    index === 0
                      ? 'Snacks between breakfast and lunch'
                      : 'Snacks between lunch and dinner'
                  }
                  slot={(index + 1) as 1 | 2}
                  meals={atSlot(index + 1)}
                  onNotice={showNotice}
                />
              ) : null}
            </div>
          ))}
          <MealSlot label="Snacks after dinner" slot={3} meals={atSlot(3)} onNotice={showNotice} />
        </div>
      )}

      {legacy.length > 0 ? (
        <Card className="mt-5">
          <CardHeader
            title="Earlier food-log entries"
            description="These entries are preserved and still count in Today and History."
          />
          <FoodLogList logs={legacy} onEdit={setEditingLegacy} onDeleted={showNotice} />
        </Card>
      ) : null}
      <LogEntryDialog
        open={editingLegacy !== null}
        onClose={() => setEditingLegacy(null)}
        date={selectedDate}
        {...(editingLegacy ? { log: editingLegacy } : {})}
        onSaved={showNotice}
      />

      <AddMealDialog
        open={adding}
        date={selectedDate}
        onClose={() => setAdding(false)}
        onSaved={showNotice}
      />
    </>
  );
}
