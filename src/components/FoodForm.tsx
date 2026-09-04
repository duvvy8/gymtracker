import { useEffect, useState } from 'react';
import { saveFood } from '../db/queries';
import { LIMITS } from '../lib/limits';
import { energyFromMacros } from '../lib/nutrition';
import { parseNumberInput, parseOptionalNumberInput, sanitizeText } from '../lib/validation';
import { Button, Callout, Field, NumberInput, TextInput } from './ui';
import type { FoodSource } from '../types';
import type { FoodFormValues } from '../lib/foodFormValues';

type FieldErrors = Partial<Record<keyof FoodFormValues, string>>;

/**
 * Create or edit a food.
 *
 * Every numeric field goes through parseNumberInput, which rejects anything
 * that is not a plain decimal before Number() sees it, and applies the
 * bounds from limits.ts. Nothing here writes to the database directly; that
 * happens in saveFood, which validates again.
 */
export function FoodForm({
  initialValues,
  foodId,
  source = 'custom',
  barcode,
  onSaved,
  onCancel,
  submitLabel,
}: {
  initialValues: FoodFormValues;
  /** Set when editing an existing food. */
  foodId?: number;
  source?: FoodSource;
  barcode?: string;
  onSaved: (foodId: number, message: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<FoodFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setErrors({});
    setFormError(undefined);
  }, [initialValues]);

  function update(field: keyof FoodFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(undefined);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};

    const name = sanitizeText(values.name, LIMITS.nameMaxLength);
    if (name === '') nextErrors.name = 'Give this food a name';

    const servingLabel = sanitizeText(values.servingLabel, LIMITS.servingLabelMaxLength);
    if (servingLabel === '') nextErrors.servingLabel = 'Describe one serving, for example 100 g';

    const servingGrams = parseOptionalNumberInput(values.servingGrams, {
      min: LIMITS.servingGramsMin,
      max: LIMITS.servingGramsMax,
      label: 'Serving weight',
    });
    if (!servingGrams.ok) nextErrors.servingGrams = servingGrams.error;

    const calories = parseNumberInput(values.calories, {
      min: LIMITS.caloriesMin,
      max: LIMITS.caloriesMax,
      label: 'Calories',
    });
    if (!calories.ok) nextErrors.calories = calories.error;

    const macroBounds = { min: LIMITS.macroMin, max: LIMITS.macroMax };
    const protein = parseNumberInput(values.protein, { ...macroBounds, label: 'Protein' });
    if (!protein.ok) nextErrors.protein = protein.error;
    const carbs = parseNumberInput(values.carbs, { ...macroBounds, label: 'Carbs' });
    if (!carbs.ok) nextErrors.carbs = carbs.error;
    const fat = parseNumberInput(values.fat, { ...macroBounds, label: 'Fat' });
    if (!fat.ok) nextErrors.fat = fat.error;

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    if (!calories.ok || !protein.ok || !carbs.ok || !fat.ok || !servingGrams.ok) return;

    setSaving(true);
    try {
      const id = await saveFood({
        ...(foodId ? { id: foodId } : {}),
        name,
        ...(values.brand.trim()
          ? { brand: sanitizeText(values.brand, LIMITS.brandMaxLength) }
          : {}),
        source,
        ...(barcode ? { barcode } : {}),
        servingLabel,
        ...(servingGrams.value === undefined ? {} : { servingGrams: servingGrams.value }),
        calories: calories.value,
        protein: protein.value,
        carbs: carbs.value,
        fat: fat.value,
      });
      onSaved(id, foodId ? `${name} updated.` : `${name} saved to your foods.`);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'That food could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  // A gentle cross-check. Calories on a label rarely match the Atwater sum
  // exactly, but a large gap usually means a digit went astray.
  const numericMacros = {
    calories: Number(values.calories.replace(',', '.')),
    protein: Number(values.protein.replace(',', '.')),
    carbs: Number(values.carbs.replace(',', '.')),
    fat: Number(values.fat.replace(',', '.')),
  };
  const macroEnergy = energyFromMacros(numericMacros);
  const showMismatch =
    Number.isFinite(numericMacros.calories) &&
    numericMacros.calories > 0 &&
    Number.isFinite(macroEnergy) &&
    macroEnergy > 0 &&
    Math.abs(macroEnergy - numericMacros.calories) / numericMacros.calories > 0.25;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={values.name}
              maxLength={LIMITS.nameMaxLength}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Rolled oats"
            />
          )}
        </Field>

        <Field label="Brand" hint="Optional" error={errors.brand}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={values.brand}
              maxLength={LIMITS.brandMaxLength}
              onChange={(event) => update('brand', event.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="One serving is"
          hint="How the figures below are measured"
          error={errors.servingLabel}
        >
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={values.servingLabel}
              maxLength={LIMITS.servingLabelMaxLength}
              onChange={(event) => update('servingLabel', event.target.value)}
              placeholder="100 g"
            />
          )}
        </Field>

        <Field
          label="Weight of one serving in grams"
          hint="Leave blank if it cannot be weighed. Filling it in lets you log by weight."
          error={errors.servingGrams}
        >
          {({ id, describedBy, invalid }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={values.servingGrams}
              onChange={(event) => update('servingGrams', event.target.value)}
              placeholder="100"
            />
          )}
        </Field>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="eyebrow mb-2">Per serving</legend>

        <Field label="Calories" error={errors.calories}>
          {({ id, describedBy, invalid }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={values.calories}
              onChange={(event) => update('calories', event.target.value)}
              placeholder="379"
            />
          )}
        </Field>

        <Field label="Protein (g)" error={errors.protein}>
          {({ id, describedBy, invalid }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={values.protein}
              onChange={(event) => update('protein', event.target.value)}
            />
          )}
        </Field>

        <Field label="Carbs (g)" error={errors.carbs}>
          {({ id, describedBy, invalid }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={values.carbs}
              onChange={(event) => update('carbs', event.target.value)}
            />
          )}
        </Field>

        <Field label="Fat (g)" error={errors.fat}>
          {({ id, describedBy, invalid }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={values.fat}
              onChange={(event) => update('fat', event.target.value)}
            />
          )}
        </Field>
      </fieldset>

      {showMismatch ? (
        <Callout>
          The macros add up to about {Math.round(macroEnergy)} kcal, which is some way from the{' '}
          {Math.round(numericMacros.calories)} kcal entered. Worth a second look, though labels do
          sometimes disagree.
        </Callout>
      ) : null}

      {formError ? <Callout tone="error">{formError}</Callout> : null}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? <Button onClick={onCancel}>Cancel</Button> : null}
        <Button type="submit" variant="primary" disabled={saving}>
          {submitLabel ?? (foodId ? 'Save changes' : 'Save food')}
        </Button>
      </div>
    </form>
  );
}
