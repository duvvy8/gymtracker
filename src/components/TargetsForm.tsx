import { useEffect, useState } from 'react';
import { saveSettings } from '../db/queries';
import { LIMITS } from '../lib/limits';
import { energyFromMacros } from '../lib/nutrition';
import { parseNumberInput } from '../lib/validation';
import { Button, Callout, Field, NumberInput, Select } from './ui';
import type { Settings, WeightUnit } from '../types';

interface TargetValues {
  calorieTarget: string;
  proteinTarget: string;
  carbTarget: string;
  fatTarget: string;
  weightUnit: WeightUnit;
}

type FieldErrors = Partial<Record<keyof TargetValues, string>>;

function toValues(settings: Settings): TargetValues {
  return {
    calorieTarget: String(settings.calorieTarget),
    proteinTarget: String(settings.proteinTarget),
    carbTarget: String(settings.carbTarget),
    fatTarget: String(settings.fatTarget),
    weightUnit: settings.weightUnit,
  };
}

export function TargetsForm({
  settings,
  onSaved,
}: {
  settings: Settings;
  onSaved: (message: string) => void;
}) {
  const [values, setValues] = useState<TargetValues>(() => toValues(settings));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Follow the stored settings until the user starts editing.
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setValues(toValues(settings));
  }, [settings, dirty]);

  function update(field: keyof TargetValues, value: string) {
    setDirty(true);
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(undefined);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    const calories = parseNumberInput(values.calorieTarget, {
      min: LIMITS.calorieTargetMin,
      max: LIMITS.calorieTargetMax,
      label: 'Calorie target',
    });
    if (!calories.ok) nextErrors.calorieTarget = calories.error;

    const macroBounds = { min: LIMITS.macroTargetMin, max: LIMITS.macroTargetMax };
    const protein = parseNumberInput(values.proteinTarget, { ...macroBounds, label: 'Protein' });
    if (!protein.ok) nextErrors.proteinTarget = protein.error;
    const carbs = parseNumberInput(values.carbTarget, { ...macroBounds, label: 'Carbs' });
    if (!carbs.ok) nextErrors.carbTarget = carbs.error;
    const fat = parseNumberInput(values.fatTarget, { ...macroBounds, label: 'Fat' });
    if (!fat.ok) nextErrors.fatTarget = fat.error;

    if (!calories.ok || !protein.ok || !carbs.ok || !fat.ok) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await saveSettings({
        calorieTarget: calories.value,
        proteinTarget: protein.value,
        carbTarget: carbs.value,
        fatTarget: fat.value,
        weightUnit: values.weightUnit,
      });
      setDirty(false);
      onSaved('Targets saved.');
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Those targets could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  // What the macro targets come to in calories, as a sanity check against
  // the calorie target. They rarely match exactly and that is fine.
  const macroEnergy = Math.round(
    energyFromMacros({
      calories: 0,
      protein: Number(values.proteinTarget.replace(',', '.')) || 0,
      carbs: Number(values.carbTarget.replace(',', '.')) || 0,
      fat: Number(values.fatTarget.replace(',', '.')) || 0,
    }),
  );
  const calorieTarget = Number(values.calorieTarget.replace(',', '.')) || 0;
  const gap = macroEnergy - calorieTarget;
  const showGap = macroEnergy > 0 && calorieTarget > 0 && Math.abs(gap) > calorieTarget * 0.1;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 p-4 sm:p-5">
      <Field label="Daily calories" hint="kcal" error={errors.calorieTarget}>
        {({ id, describedBy, invalid }) => (
          <NumberInput
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            value={values.calorieTarget}
            onChange={(event) => update('calorieTarget', event.target.value)}
            className="sm:max-w-48"
          />
        )}
      </Field>

      <fieldset className="grid gap-4 sm:max-w-xl sm:grid-cols-3">
        <legend className="eyebrow mb-2">Daily macros in grams</legend>

        <Field label="Protein" error={errors.proteinTarget}>
          {({ id, describedBy, invalid }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={values.proteinTarget}
              onChange={(event) => update('proteinTarget', event.target.value)}
            />
          )}
        </Field>

        <Field label="Carbs" error={errors.carbTarget}>
          {({ id, describedBy, invalid }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={values.carbTarget}
              onChange={(event) => update('carbTarget', event.target.value)}
            />
          )}
        </Field>

        <Field label="Fat" error={errors.fatTarget}>
          {({ id, describedBy, invalid }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={values.fatTarget}
              onChange={(event) => update('fatTarget', event.target.value)}
            />
          )}
        </Field>
      </fieldset>

      {showGap ? (
        <Callout>
          Those macro targets come to about {macroEnergy} kcal, {gap > 0 ? 'above' : 'below'} your{' '}
          {calorieTarget} kcal target. That may well be intentional.
        </Callout>
      ) : null}

      <Field label="Show body weight in" hint="Weight is always stored in kilograms">
        {({ id, describedBy }) => (
          <Select
            id={id}
            aria-describedby={describedBy}
            value={values.weightUnit}
            onChange={(event) => update('weightUnit', event.target.value)}
            className="sm:max-w-48"
          >
            <option value="kg">Kilograms</option>
            <option value="lb">Pounds</option>
          </Select>
        )}
      </Field>

      {formError ? <Callout tone="error">{formError}</Callout> : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={saving}>
          Save targets
        </Button>
      </div>
    </form>
  );
}
