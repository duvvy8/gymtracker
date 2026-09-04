import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getFood, saveFoodLog } from '../db/queries';
import { LIMITS } from '../lib/limits';
import { formatCalories, formatGrams, round1, scaleFood } from '../lib/nutrition';
import { parseNumberInput } from '../lib/validation';
import { Dialog } from './Dialog';
import { Button, Callout, Field, NumberInput, Select } from './ui';
import type { Food, FoodLog, IsoDate, LogUnit, Macros } from '../types';

function boundsFor(unit: LogUnit) {
  return unit === 'g'
    ? { min: LIMITS.amountGramsMin, max: LIMITS.amountGramsMax, label: 'Amount' }
    : { min: LIMITS.amountServingsMin, max: LIMITS.amountServingsMax, label: 'Amount' };
}

/**
 * Works out the totals for an amount.
 *
 * When the source food is still in the database the figures are recomputed
 * from it. When it has been deleted, an existing entry is scaled from its
 * own stored snapshot instead, which is exact because nutrition scales
 * linearly. That is why the unit cannot be changed in the second case.
 */
function computeTotals(
  amount: number,
  unit: LogUnit,
  food: Food | undefined,
  existing: FoodLog | undefined,
): Macros | null {
  if (food) return scaleFood(food, amount, unit);

  if (existing && existing.amount > 0 && existing.unit === unit) {
    const ratio = amount / existing.amount;
    return {
      calories: round1(existing.calories * ratio),
      protein: round1(existing.protein * ratio),
      carbs: round1(existing.carbs * ratio),
      fat: round1(existing.fat * ratio),
    };
  }

  return null;
}

export function LogEntryDialog({
  open,
  onClose,
  date,
  food: providedFood,
  log,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  date: IsoDate;
  /** The food being logged, when creating an entry. */
  food?: Food;
  /** The entry being edited. Absent when creating. */
  log?: FoodLog;
  onSaved: (message: string) => void;
}) {
  // When editing, the entry's food is looked up so the amount can be
  // recomputed from the source rather than scaled from the snapshot. It
  // resolves to undefined if that food has since been deleted, which the
  // fallback path in computeTotals handles.
  const linkedFood = useLiveQuery(
    () => (log?.foodId === undefined ? Promise.resolve(undefined) : getFood(log.foodId)),
    [log?.foodId],
  );
  const food = providedFood ?? linkedFood;

  const canWeigh = Boolean(food?.servingGrams && food.servingGrams > 0);
  const canChangeUnit = Boolean(food) && canWeigh;

  const [amountText, setAmountText] = useState('');
  const [unit, setUnit] = useState<LogUnit>('serving');
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Reset the form whenever the dialog is opened for a different subject.
  useEffect(() => {
    if (!open) return;
    setError(undefined);
    setSaving(false);

    if (log) {
      setAmountText(String(log.amount));
      setUnit(log.unit);
      return;
    }

    if (food?.servingGrams) {
      setUnit('g');
      setAmountText(String(food.servingGrams));
    } else {
      setUnit('serving');
      setAmountText('1');
    }
  }, [open, food, log]);

  const parsed = parseNumberInput(amountText, boundsFor(unit));
  const preview = parsed.ok ? computeTotals(parsed.value, unit, food, log) : null;

  const title = log ? 'Edit entry' : 'Add to the log';
  const subject = food?.name ?? log?.name ?? 'Entry';
  const servingLabel = food?.servingLabel ?? log?.servingLabel ?? '1 serving';

  async function handleSave() {
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    const totals = computeTotals(parsed.value, unit, food, log);
    if (!totals) {
      setError(
        canWeigh
          ? 'This amount could not be converted. Try entering servings instead.'
          : 'This food has no known weight per serving, so it can only be logged in servings.',
      );
      return;
    }

    setSaving(true);
    try {
      await saveFoodLog({
        ...(log?.id ? { id: log.id } : {}),
        date: log?.date ?? date,
        ...(food?.id ? { foodId: food.id } : log?.foodId ? { foodId: log.foodId } : {}),
        amount: parsed.value,
        unit,
        name: subject,
        ...(food?.brand ? { brand: food.brand } : log?.brand ? { brand: log.brand } : {}),
        servingLabel,
        ...totals,
      });
      onSaved(log ? 'Entry updated.' : `${subject} added to the log.`);
      onClose();
    } catch (cause) {
      // Only this application's own message is shown, never a raw error.
      setError(cause instanceof Error ? cause.message : 'That entry could not be saved.');
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={subject}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !parsed.ok}>
            {log ? 'Save changes' : 'Add entry'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Amount"
          error={!parsed.ok && amountText !== '' ? parsed.error : undefined}
          hint={unit === 'g' ? `One serving is ${servingLabel}` : `Servings of ${servingLabel}`}
        >
          {({ id, describedBy, invalid }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={amountText}
              onChange={(event) => {
                setAmountText(event.target.value);
                setError(undefined);
              }}
              data-autofocus
            />
          )}
        </Field>

        <Field label="Measured in">
          {({ id }) => (
            <Select
              id={id}
              value={unit}
              disabled={!canChangeUnit}
              onChange={(event) => {
                const next = event.target.value as LogUnit;
                setUnit(next);
                setError(undefined);
                if (next === 'g' && food?.servingGrams) setAmountText(String(food.servingGrams));
                if (next === 'serving') setAmountText('1');
              }}
            >
              <option value="serving">Servings</option>
              {canWeigh || unit === 'g' ? <option value="g">Grams</option> : null}
            </Select>
          )}
        </Field>
      </div>

      <div className="mt-4 rounded-md border border-line bg-sunken px-4 py-3">
        <p className="eyebrow mb-2">This entry</p>
        {preview ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-ink-3">Calories</dt>
              <dd className="numeric text-lg font-semibold text-ink">
                {formatCalories(preview.calories)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">Protein</dt>
              <dd className="numeric text-lg font-semibold text-protein">
                {formatGrams(preview.protein)} g
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">Carbs</dt>
              <dd className="numeric text-lg font-semibold text-carb">
                {formatGrams(preview.carbs)} g
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">Fat</dt>
              <dd className="numeric text-lg font-semibold text-fat">
                {formatGrams(preview.fat)} g
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-ink-3">Enter an amount to see the totals.</p>
        )}
      </div>

      {error ? (
        <div className="mt-4">
          <Callout tone="error">{error}</Callout>
        </div>
      ) : null}
    </Dialog>
  );
}
