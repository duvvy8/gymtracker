import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { deleteBodyWeight, listBodyWeights, saveBodyWeight } from '../db/queries';
import { formatFullDate, todayIso } from '../lib/date';
import { LIMITS } from '../lib/limits';
import { displayToKg, formatWeight, kgToDisplay } from '../lib/nutrition';
import { isoDateSchema, parseNumberInput } from '../lib/validation';
import { IconTrash } from './icons';
import { Button, Callout, EmptyState, Field, NumberInput, TextInput } from './ui';
import type { WeightUnit } from '../types';

/**
 * Body weight entry and the recent readings.
 *
 * Weight is stored in kilograms whatever the display unit, so switching
 * between kg and lb never rewrites the record. The bounds are checked in
 * the display unit the user typed, then converted.
 */
export function BodyWeightPanel({
  unit,
  onSaved,
}: {
  unit: WeightUnit;
  onSaved: (message: string) => void;
}) {
  const [date, setDate] = useState(todayIso());
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [dateError, setDateError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const readings = useLiveQuery(() => listBodyWeights(), []);
  const recent = (readings ?? []).slice(-8).reverse();

  // Bounds expressed in whatever unit is on screen.
  const minDisplay = Math.ceil(kgToDisplay(LIMITS.weightKgMin, unit));
  const maxDisplay = Math.floor(kgToDisplay(LIMITS.weightKgMax, unit));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    setDateError(undefined);

    const parsedDate = isoDateSchema.safeParse(date);
    if (!parsedDate.success) {
      setDateError('Pick a real date');
      return;
    }
    if (parsedDate.data > todayIso()) {
      setDateError('That date is in the future');
      return;
    }

    const parsed = parseNumberInput(weight, {
      min: minDisplay,
      max: maxDisplay,
      label: 'Weight',
    });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setSaving(true);
    try {
      await saveBodyWeight(parsedDate.data, displayToKg(parsed.value, unit));
      setWeight('');
      onSaved(`Weight recorded for ${formatFullDate(parsedDate.data)}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That weight could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-5">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-4 sm:max-w-xl sm:grid-cols-[1fr_1fr_auto]"
      >
        <Field label="Date" error={dateError}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              type="date"
              max={todayIso()}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setDateError(undefined);
              }}
            />
          )}
        </Field>

        <Field label={`Weight in ${unit}`} error={error}>
          {({ id, describedBy, invalid }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={weight}
              onChange={(event) => {
                setWeight(event.target.value);
                setError(undefined);
              }}
              placeholder={unit === 'kg' ? '82.4' : '181.7'}
            />
          )}
        </Field>

        <div className="flex items-end">
          <Button type="submit" variant="primary" disabled={saving} className="w-full sm:w-auto">
            Record
          </Button>
        </div>
      </form>

      <p className="mt-2 text-xs text-ink-3">
        One reading per day. Saving again for the same date replaces it.
      </p>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="eyebrow mb-3">Recent readings</h3>
        {recent.length === 0 ? (
          <EmptyState title="No readings yet">
            Weight you record shows up here and on the History page.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-3 py-2">
                <span className="numeric min-w-0 flex-1 truncate text-sm text-ink-2">
                  {formatFullDate(entry.date)}
                </span>
                <span className="numeric text-sm font-semibold text-weight">
                  {formatWeight(entry.weightKg, unit)}
                </span>
                {confirmingId === entry.id ? (
                  <span className="flex gap-2">
                    <Button size="sm" onClick={() => setConfirmingId(null)}>
                      Keep
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (entry.id !== undefined) void deleteBodyWeight(entry.id);
                        setConfirmingId(null);
                        onSaved('Reading removed.');
                      }}
                    >
                      Remove
                    </Button>
                  </span>
                ) : (
                  <Button
                    variant="quiet"
                    size="icon"
                    onClick={() => setConfirmingId(entry.id ?? null)}
                    aria-label={`Remove the reading for ${formatFullDate(entry.date)}`}
                  >
                    <IconTrash />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {readings && readings.length > recent.length ? (
        <Callout>
          Showing the {recent.length} most recent of {readings.length} readings. The full record is
          on the History page and in an export.
        </Callout>
      ) : null}
    </div>
  );
}
