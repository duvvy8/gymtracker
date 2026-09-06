import { useEffect, useState } from 'react';
import { saveSettings } from '../db/queries';
import { LIMITS } from '../lib/limits';
import { energyFromMacros } from '../lib/nutrition';
import { parseNumberInput, isValidationError } from '../lib/validation';
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
    if (saving) return;

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
      setFormError(isValidationError(cause) ? cause.message : 'Those targets could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  // What the macro targets come to in calories, as a sanity check against
  // the calorie target. They rarely match exactly and that is fine.
  const previewProtein = parseNumberInput(values.proteinTarget, {
    min: LIMITS.macroTargetMin,
    max: LIMITS.macroTargetMax,
    label: 'Protein',
  });
  const previewCarbs = parseNumberInput(values.carbTarget, {
    min: LIMITS.macroTargetMin,
    max: LIMITS.macroTargetMax,
    label: 'Carbs',
  });
  const previewFat = parseNumberInput(values.fatTarget, {
    min: LIMITS.macroTargetMin,
    max: LIMITS.macroTargetMax,
    label: 'Fat',
  });
  const previewCalories = parseNumberInput(values.calorieTarget, {
    min: LIMITS.calorieTargetMin,
    max: LIMITS.calorieTargetMax,
    label: 'Calorie target',
  });
  const macroEnergy =
    previewProtein.ok && previewCarbs.ok && previewFat.ok
      ? Math.round(
          energyFromMacros({
            calories: 0,
            protein: previewProtein.value,
            carbs: previewCarbs.value,
            fat: previewFat.value,
          }),
        )
      : 0;
  const calorieTarget = previewCalories.ok ? previewCalories.value : 0;
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
        <Callout announce={false}>
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
          {saving ? 'Saving targets' : 'Save targets'}
        </Button>
      </div>
    </form>
  );
}
