import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import {
  findFoodByBarcode,
  getSettings,
  saveMealWithComponents,
  saveSettings,
  searchFoods,
} from '../db/queries';
import { EMPTY_FOOD_FORM, type FoodFormValues } from '../lib/foodFormValues';
import { postMealImage, HttpError } from '../lib/http';
import { prepareMealImage } from '../lib/imagePrep';
import { mealAnalysisResponseSchema, resolveCofid } from '../lib/mealAnalysis';
import { MEAL_MODELS, resolveMealModel, type MealModelId } from '../lib/mealModels.ts';
import { lookupBarcode } from '../lib/openFoodFacts';
import { nutrientsFromFood, scaleNutrients, sumNutrients } from '../lib/nutrition';
import { isValidationError } from '../lib/validation';
import type {
  Food,
  IsoDate,
  MealCategory,
  MealComponentKind,
  NutritionConfidence,
  NutritionSource,
  Nutrients,
} from '../types';
import { Dialog } from './Dialog';
import { IconBarcode, IconCamera, IconPlus, IconTrash } from './icons';
import { Button, Callout, Field, NumberInput, Select, TextInput } from './ui';

const BarcodeScanner = lazy(() =>
  import('./BarcodeScanner').then((module) => ({ default: module.BarcodeScanner })),
);

type Method = 'photo' | 'saved' | 'barcode' | 'manual' | 'drink';

interface DraftComponent {
  key: string;
  foodId?: number;
  name: string;
  amount: number;
  unit: 'g' | 'ml' | 'serving';
  servingLabel: string;
  preparation: string;
  portionConfidence: NutritionConfidence;
  identityConfidence: NutritionConfidence;
  uncertainty: string;
  nutritionSource: NutritionSource;
  nutritionReference?: string;
  nutritionBasis: Nutrients;
  basisUnit: '100g' | '100ml' | 'serving';
  componentKind: MealComponentKind;
  nutritionOverridden: boolean;
  nutritionOverride?: Nutrients;
  reviewed: boolean;
}

const EMPTY_NUTRIENTS: Nutrients = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fibre: 0,
  sugars: 0,
  saturatedFat: 0,
  salt: 0,
};

function key() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

type ComponentFood = Pick<
  Food,
  | 'id'
  | 'name'
  | 'servingLabel'
  | 'servingGrams'
  | 'calories'
  | 'protein'
  | 'carbs'
  | 'fat'
  | 'fibre'
  | 'sugars'
  | 'saturatedFat'
  | 'salt'
>;

function componentFromFood(
  food: ComponentFood,
  source: NutritionSource = 'saved-food',
): DraftComponent {
  const serving = nutrientsFromFood(food);
  const canWeigh = Boolean(food.servingGrams && food.servingGrams > 0);
  const nutritionBasis = canWeigh
    ? scaleNutrients(serving, 100 / (food.servingGrams as number), 'serving')
    : serving;
  return {
    key: key(),
    ...(food.id === undefined ? {} : { foodId: food.id }),
    name: food.name,
    amount: canWeigh ? (food.servingGrams as number) : 1,
    unit: canWeigh ? 'g' : 'serving',
    servingLabel: food.servingLabel,
    preparation: '',
    portionConfidence: 'high',
    identityConfidence: 'high',
    uncertainty: '',
    nutritionSource: source,
    ...(source === 'barcode' ? { nutritionReference: 'Open Food Facts' } : {}),
    nutritionBasis,
    basisUnit: canWeigh ? '100g' : 'serving',
    componentKind: 'food',
    nutritionOverridden: false,
    reviewed: true,
  };
}

function blankComponent(kind: MealComponentKind = 'food'): DraftComponent {
  return {
    key: key(),
    name: kind === 'drink' ? 'Water' : 'Food item',
    amount: kind === 'drink' ? 250 : 100,
    unit: kind === 'drink' ? 'ml' : 'g',
    servingLabel: kind === 'drink' ? '100 ml' : '100 g',
    preparation: '',
    portionConfidence: 'high',
    identityConfidence: 'high',
    uncertainty: '',
    nutritionSource: 'manual',
    nutritionBasis: { ...EMPTY_NUTRIENTS },
    basisUnit: kind === 'drink' ? '100ml' : '100g',
    componentKind: kind,
    nutritionOverridden: true,
    nutritionOverride: { ...EMPTY_NUTRIENTS },
    reviewed: true,
  };
}

const nutrientLabels: Array<[keyof Nutrients, string, string]> = [
  ['calories', 'Calories', 'kcal'],
  ['protein', 'Protein', 'g'],
  ['carbs', 'Carbs', 'g'],
  ['fat', 'Fat', 'g'],
  ['fibre', 'Fibre', 'g'],
  ['sugars', 'Sugars', 'g'],
  ['saturatedFat', 'Saturated fat', 'g'],
  ['salt', 'Salt', 'g'],
];

function EditableNumber({
  id,
  value,
  min = 0,
  onCommit,
}: {
  id: string;
  value: number;
  min?: number;
  onCommit: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  function commit() {
    const parsed = Number(text.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed >= min) onCommit(parsed);
    else setText(String(value));
  }
  return (
    <NumberInput
      id={id}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
      }}
    />
  );
}

function ComponentEditor({
  component,
  onChange,
  onRemove,
}: {
  component: DraftComponent;
  onChange: (next: DraftComponent) => void;
  onRemove: () => void;
}) {
  const [amountStatus, setAmountStatus] = useState('');
  const calculated = scaleNutrients(
    component.nutritionBasis,
    component.amount,
    component.basisUnit,
  );
  const total = component.nutritionOverride ?? calculated;
  const needsReview =
    component.identityConfidence === 'low' || component.portionConfidence === 'low';

  function matchFoodReference() {
    const match = resolveCofid(component.name, component.preparation);
    if (!match) return;
    onChange({
      ...component,
      name: match.food.name,
      nutritionSource: 'cofid',
      nutritionReference: match.food.code,
      nutritionBasis: { ...match.food.nutrients },
      basisUnit: match.food.basisUnit,
      identityConfidence: match.confidence,
      nutritionOverridden: false,
      nutritionOverride: undefined,
      reviewed: true,
    });
  }

  function updateAmount(value: number) {
    const previous = component.amount;
    if (value === previous) return;
    onChange({ ...component, amount: value, reviewed: needsReview ? true : component.reviewed });
    setAmountStatus(
      component.nutritionOverridden
        ? `Amount updated from ${previous} ${component.unit} to ${value} ${component.unit}. Your manual nutrition values were kept.`
        : `Nutrition updated for ${value} ${component.unit}.`,
    );
  }

  return (
    <article className="rounded-md border border-line bg-surface p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <TextInput
            aria-label="Item name"
            value={component.name}
            maxLength={120}
            onChange={(event) =>
              onChange({
                ...component,
                name: event.target.value,
                reviewed: needsReview ? true : component.reviewed,
              })
            }
            onBlur={matchFoodReference}
          />
          <p className="mt-1 text-xs text-ink-3">
            {component.nutritionSource === 'cofid'
              ? `Reference nutrition: CoFID 2021${component.nutritionReference ? ` · ${component.nutritionReference}` : ''}`
              : component.nutritionSource === 'ai-estimate'
                ? 'AI nutrition estimate'
                : component.nutritionSource === 'barcode'
                  ? 'From reviewed barcode data'
                  : component.nutritionSource === 'saved-food'
                    ? 'From your saved foods'
                    : 'Manual nutrition'}
          </p>
          <p className="mt-1 text-xs text-ink-3">
            Food confidence: {component.identityConfidence}. Portion confidence:{' '}
            {component.portionConfidence}.
          </p>
        </div>
        <Button
          variant="quiet"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove ${component.name}`}
        >
          <IconTrash />
        </Button>
      </div>

      <Button className="mt-3" size="sm" variant="quiet" onClick={matchFoodReference}>
        Change food / match reference
      </Button>

      {needsReview ? (
        <div className="mt-3">
          <Callout title="Needs review" announce={false}>
            AI is unsure about the food or portion. Change the food, amount or nutrition, remove it,
            or confirm that you reviewed the estimate.
          </Callout>
          <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={component.reviewed}
              onChange={(event) => onChange({ ...component, reviewed: event.target.checked })}
            />
            I reviewed this estimate
          </label>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Amount">
          {({ id }) => (
            <EditableNumber id={id} value={component.amount} min={0.1} onCommit={updateAmount} />
          )}
        </Field>
        <Field label="Unit">
          {({ id }) => (
            <Select id={id} value={component.unit} disabled>
              <option value={component.unit}>
                {component.unit === 'g'
                  ? 'Grams'
                  : component.unit === 'ml'
                    ? 'Millilitres'
                    : 'Servings'}
              </option>
            </Select>
          )}
        </Field>
        <Field label="Preparation">
          {({ id }) => (
            <TextInput
              id={id}
              value={component.preparation}
              maxLength={60}
              placeholder="grilled, fried…"
              onChange={(event) => onChange({ ...component, preparation: event.target.value })}
            />
          )}
        </Field>
      </div>

      {amountStatus ? (
        <p role="status" className="mt-2 text-xs text-ink-3">
          {amountStatus}
        </p>
      ) : null}

      <dl className="mt-3 grid grid-cols-4 gap-2 text-xs">
        <div>
          <dt className="text-ink-3">Calories</dt>
          <dd>{Math.round(total.calories)} kcal</dd>
        </div>
        <div>
          <dt className="text-ink-3">Protein</dt>
          <dd>{total.protein.toFixed(1)} g</dd>
        </div>
        <div>
          <dt className="text-ink-3">Carbs</dt>
          <dd>{total.carbs.toFixed(1)} g</dd>
        </div>
        <div>
          <dt className="text-ink-3">Fat</dt>
          <dd>{total.fat.toFixed(1)} g</dd>
        </div>
      </dl>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-accent">
          Review nutrition · {Math.round(total.calories)} kcal
        </summary>
        <p className="mt-2 text-xs text-ink-3">
          These are the final values for this item. Editing them creates a manual override that is
          kept if the amount changes.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {nutrientLabels.map(([field, label, suffix]) => (
            <Field key={field} label={`${label} (${suffix})`}>
              {({ id }) => (
                <EditableNumber
                  id={id}
                  value={total[field]}
                  onCommit={(value) => {
                    onChange({
                      ...component,
                      nutritionOverride: { ...total, [field]: value },
                      nutritionOverridden: true,
                      reviewed: needsReview ? true : component.reviewed,
                    });
                  }}
                />
              )}
            </Field>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Identity confidence">
            {({ id }) => (
              <Select
                id={id}
                value={component.identityConfidence}
                onChange={(event) =>
                  onChange({
                    ...component,
                    identityConfidence: event.target.value as NutritionConfidence,
                  })
                }
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            )}
          </Field>
          <Field label="Portion confidence">
            {({ id }) => (
              <Select
                id={id}
                value={component.portionConfidence}
                onChange={(event) =>
                  onChange({
                    ...component,
                    portionConfidence: event.target.value as NutritionConfidence,
                  })
                }
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            )}
          </Field>
        </div>
        {component.nutritionOverridden ? (
          <Button
            className="mt-3"
            size="sm"
            variant="quiet"
            onClick={() =>
              onChange({
                ...component,
                nutritionOverride: undefined,
                nutritionOverridden: false,
              })
            }
          >
            Reset to calculated nutrition
          </Button>
        ) : null}
        <Field label="Uncertainty" className="mt-3">
          {({ id }) => (
            <TextInput
              id={id}
              value={component.uncertainty}
              maxLength={240}
              placeholder="Hidden oil, unclear portion…"
              onChange={(event) => onChange({ ...component, uncertainty: event.target.value })}
            />
          )}
        </Field>
      </details>
    </article>
  );
}

function foodFromBarcode(
  values: FoodFormValues,
  source: Food['source'],
  barcode: string,
): Omit<Food, 'id' | 'nameLower' | 'createdAt' | 'updatedAt'> {
  const number = (value: string) => Number(value.replace(',', '.')) || 0;
  return {
    name: values.name || 'Barcode item',
    ...(values.brand ? { brand: values.brand } : {}),
    source,
    barcode,
    servingLabel: values.servingLabel || '100 g',
    ...(values.servingGrams ? { servingGrams: number(values.servingGrams) } : {}),
    calories: number(values.calories),
    protein: number(values.protein),
    carbs: number(values.carbs),
    fat: number(values.fat),
  };
}

export function AddMealDialog({
  open,
  date,
  onClose,
  onSaved,
}: {
  open: boolean;
  date: IsoDate;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [method, setMethod] = useState<Method>('photo');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MealCategory | ''>('');
  const [snackSlot, setSnackSlot] = useState<0 | 1 | 2 | 3>(3);
  const [components, setComponents] = useState<DraftComponent[]>([]);
  const [term, setTerm] = useState('');
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const photoInput = useRef<HTMLInputElement | null>(null);
  const settings = useLiveQuery(() => getSettings(), []);
  // Held locally as well so the control responds immediately rather than
  // waiting for the write to come back through the live query.
  const [modelChoice, setModelChoice] = useState<MealModelId | null>(null);
  const mealModel = modelChoice ?? resolveMealModel(settings?.mealModel);

  async function chooseModel(value: string) {
    const next = resolveMealModel(value);
    setModelChoice(next);
    if (!settings) return;
    await saveSettings({
      calorieTarget: settings.calorieTarget,
      proteinTarget: settings.proteinTarget,
      carbTarget: settings.carbTarget,
      fatTarget: settings.fatTarget,
      weightUnit: settings.weightUnit,
      mealModel: next,
    });
  }
  const foods = useLiveQuery(() => searchFoods(term, 12), [term]);
  const totals = useMemo(
    () =>
      sumNutrients(
        components.map(
          (item) =>
            item.nutritionOverride ??
            scaleNutrients(item.nutritionBasis, item.amount, item.basisUnit),
        ),
      ),
    [components],
  );

  useEffect(() => {
    if (!open) return;
    setMethod('photo');
    setName('');
    setCategory('');
    setSnackSlot(3);
    setComponents([]);
    setTerm('');
    setError(undefined);
    setBusy(false);
  }, [open, date]);

  useEffect(
    () => () => {
      controller.current?.abort();
      if (photo) URL.revokeObjectURL(photo.url);
    },
    [photo],
  );

  function replacePhoto(next: { blob: Blob; url: string } | null) {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(next);
  }

  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    setError(undefined);
    try {
      const blob = await prepareMealImage(file);
      setComponents([]);
      setName('');
      replacePhoto({ blob, url: URL.createObjectURL(blob) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That image could not be prepared.');
    }
  }

  async function analysePhoto() {
    if (!photo || busy) return;
    if (Date.now() < cooldownUntil) {
      setError('Please wait a few seconds before analysing another image.');
      return;
    }
    const nextController = new AbortController();
    controller.current = nextController;
    setBusy(true);
    setError(undefined);
    try {
      const parsed = mealAnalysisResponseSchema.parse(
        await postMealImage(photo.blob, nextController.signal, mealModel),
      );
      setName(parsed.suggestedName);
      setComponents(
        parsed.items.map((item) => ({
          key: key(),
          name: item.name,
          amount: item.estimatedAmount,
          unit: item.unit,
          servingLabel: item.unit === 'ml' ? '100 ml' : '100 g',
          preparation: item.preparation,
          portionConfidence: item.portionConfidence,
          identityConfidence: item.identityConfidence,
          uncertainty: item.uncertainty,
          nutritionSource: item.nutritionSource,
          nutritionBasis: item.nutritionBasis,
          basisUnit: item.basisUnit,
          ...(item.referenceCode ? { nutritionReference: item.referenceCode } : {}),
          componentKind: item.unit === 'ml' ? 'drink' : 'food',
          nutritionOverridden: false,
          reviewed: item.identityConfidence !== 'low' && item.portionConfidence !== 'low',
        })),
      );
      setCooldownUntil(Date.now() + 10_000);
      replacePhoto(null);
    } catch (cause) {
      if (cause instanceof HttpError && cause.kind === 'blocked') return;
      setError(
        cause instanceof HttpError
          ? cause.message
          : 'The response was not valid meal data. Try again or enter it manually.',
      );
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }

  async function handleBarcode(barcode: string) {
    setBusy(true);
    setError(undefined);
    try {
      const existing = await findFoodByBarcode(barcode);
      if (existing) {
        setComponents((items) => [...items, componentFromFood(existing, 'barcode')]);
        setName((value) => value || existing.name);
        setScannerOpen(false);
        return;
      }
      const result = await lookupBarcode(barcode);
      if (result.outcome === 'error') {
        setError(result.message);
        return;
      }
      const values =
        result.outcome === 'found' ? result.values : { ...EMPTY_FOOD_FORM, name: 'Barcode item' };
      const source = result.outcome === 'found' ? 'openfoodfacts' : 'custom';
      const candidate = foodFromBarcode(values, source, result.barcode);
      setComponents((items) => [...items, componentFromFood(candidate, 'barcode')]);
      setName((value) => value || candidate.name);
      setScannerOpen(false);
    } catch {
      setError('That barcode could not be added. Try again or use manual entry.');
    } finally {
      setBusy(false);
    }
  }

  function addDrink(kind: 'water' | 'protein' | 'nutrition' | 'custom', amount: number) {
    const item = blankComponent('drink');
    item.amount = amount;
    if (kind === 'water') item.name = 'Water';
    if (kind === 'protein') {
      item.name = 'Protein shake';
      item.nutritionBasis = {
        calories: 62,
        protein: 10,
        carbs: 3.8,
        fat: 0.8,
        fibre: 0,
        sugars: 3.8,
        saturatedFat: 0.5,
        salt: 0.12,
      };
    }
    if (kind === 'nutrition') item.name = 'Nutrition drink';
    if (kind === 'custom') item.name = 'Drink';
    setComponents((items) => [...items, item]);
    setName((value) => value || item.name);
  }

  async function save() {
    if (busy) return;
    if (!name.trim()) {
      setError('Enter a meal name.');
      return;
    }
    if (!category) {
      setError('Choose Breakfast, Lunch, Dinner or Snack.');
      return;
    }
    if (components.length === 0) {
      setError('Add at least one food or drink.');
      return;
    }
    if (components.some((item) => !item.reviewed)) {
      setError('Review or remove each low-confidence item before saving.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await saveMealWithComponents(
        {
          date,
          name,
          category,
          ...(category === 'snack' ? { snackSlot } : {}),
          sortOrder: Date.now(),
        },
        components.map((item) => ({
          date,
          ...(item.foodId === undefined ? {} : { foodId: item.foodId }),
          amount: item.amount,
          unit: item.unit,
          name: item.name,
          servingLabel: item.servingLabel,
          ...(item.nutritionOverride ??
            scaleNutrients(item.nutritionBasis, item.amount, item.basisUnit)),
          componentKind: item.componentKind,
          preparation: item.preparation,
          portionConfidence: item.portionConfidence,
          identityConfidence: item.identityConfidence,
          uncertainty: item.uncertainty,
          nutritionSource: item.nutritionSource,
          ...(item.nutritionReference ? { nutritionReference: item.nutritionReference } : {}),
          nutritionBasis: item.nutritionBasis,
          basisUnit: item.basisUnit,
          nutritionOverridden: item.nutritionOverridden,
        })),
      );
      replacePhoto(null);
      onSaved(`${name.trim()} saved.`);
      onClose();
    } catch (cause) {
      setError(
        isValidationError(cause) ? cause.message : 'That meal could not be saved. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  const methods: Array<[Method, string]> = [
    ['photo', 'Photo'],
    ['saved', 'Saved foods'],
    ['barcode', 'Barcode'],
    ['manual', 'Manual'],
    ['drink', '+ Add drink'],
  ];

  function closeDialog() {
    controller.current?.abort();
    replacePhoto(null);
    onClose();
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={closeDialog}
        title="Add meal"
        description="Build one grouped meal, then review every item before saving."
        size="wide"
        footer={
          <>
            <Button onClick={closeDialog} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void save()}
              disabled={busy || components.length === 0}
            >
              {busy ? 'Working' : 'Save meal'}
            </Button>
          </>
        }
      >
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Meal name" className="col-span-2">
                {({ id }) => (
                  <TextInput
                    id={id}
                    data-autofocus
                    value={name}
                    maxLength={120}
                    placeholder="Chicken and rice"
                    onChange={(event) => setName(event.target.value)}
                  />
                )}
              </Field>
              <Field label="Type">
                {({ id }) => (
                  <Select
                    id={id}
                    value={category}
                    onChange={(event) => setCategory(event.target.value as MealCategory)}
                  >
                    <option value="" disabled>
                      Choose one...
                    </option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </Select>
                )}
              </Field>
              {category === 'snack' ? (
                <Field label="Snack position" className="col-span-2 sm:col-span-1">
                  {({ id }) => (
                    <Select
                      id={id}
                      value={snackSlot}
                      onChange={(event) =>
                        setSnackSlot(Number(event.target.value) as 0 | 1 | 2 | 3)
                      }
                    >
                      <option value={0}>Before breakfast</option>
                      <option value={1}>Between breakfast and lunch</option>
                      <option value={2}>Between lunch and dinner</option>
                      <option value={3}>After dinner</option>
                    </Select>
                  )}
                </Field>
              ) : null}
            </div>

            <div
              className="mt-5 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Add meal item method"
            >
              {methods.map(([value, label]) => (
                <Button
                  key={value}
                  role="tab"
                  aria-selected={method === value}
                  variant={method === value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setMethod(value)}
                >
                  {value === 'photo' ? (
                    <IconCamera />
                  ) : value === 'barcode' ? (
                    <IconBarcode />
                  ) : (
                    <IconPlus />
                  )}
                  {label}
                </Button>
              ))}
            </div>

            <section className="mt-4 rounded-md border border-line bg-sunken p-4">
              {method === 'photo' ? (
                <div>
                  <h3 className="font-semibold">Analyse one meal photo</h3>
                  <p className="mt-1 text-sm text-ink-3">
                    The processed image is sent once to Google Gemini for analysis. It is not added
                    to your log, backup or browser database. Estimates can be wrong; review them
                    before saving.{' '}
                    <Link className="text-accent underline" to="/privacy">
                      Privacy details
                    </Link>
                    .
                  </p>
                  <p className="mt-2 text-sm text-ink-3">
                    For clearer portions, photograph the whole plate from above in even light, with
                    sauces and drinks visible.
                  </p>
                  {/*
                    The real control is the button below. This input is only the
                    file picker it delegates to, so it is taken out of the tab
                    order rather than left as a clipped, unnamed stop for
                    keyboard users.
                  */}
                  <input
                    ref={photoInput}
                    id="meal-photo"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      // Clear the input afterwards so removing a photo and then
                      // picking the same file again still fires a change event.
                      const input = event.target;
                      void choosePhoto(input.files?.[0]).finally(() => {
                        input.value = '';
                      });
                    }}
                  />
                  <Button
                    className="mt-4"
                    variant="primary"
                    onClick={() => photoInput.current?.click()}
                    disabled={busy}
                  >
                    <IconCamera />
                    {photo ? 'Change meal photo' : 'Add meal photo'}
                  </Button>
                  {photo ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-[10rem_1fr]">
                      <img
                        src={photo.url}
                        alt="Selected meal preview"
                        className="h-40 w-40 rounded-md border border-line object-cover"
                      />
                      <div className="flex flex-wrap content-start gap-2">
                        <Button
                          variant="primary"
                          onClick={() => void analysePhoto()}
                          disabled={busy || !category}
                        >
                          {busy ? 'Analysing' : 'Analyse photo'}
                        </Button>
                        <Button onClick={() => replacePhoto(null)} disabled={busy}>
                          Remove photo
                        </Button>
                        {busy ? (
                          <Button variant="quiet" onClick={() => controller.current?.abort()}>
                            Cancel analysis
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {photo && !category ? (
                    <p className="mt-2 text-sm text-ink-3">Choose a meal type before analysis.</p>
                  ) : null}
                  <Field label="Analysis model" className="mt-4 max-w-xs">
                    {({ id }) => (
                      <Select
                        id={id}
                        value={mealModel}
                        disabled={busy}
                        onChange={(event) => void chooseModel(event.target.value)}
                      >
                        {MEAL_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.label}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <p className="mt-1 text-xs text-ink-3">
                    {MEAL_MODELS.find((model) => model.id === mealModel)?.note} Each model has its
                    own daily free allowance, so switching gives you more analyses once one is used
                    up.
                  </p>
                  {busy ? (
                    <p role="status" className="mt-3 text-sm text-ink-2">
                      Identifying foods and estimating portions. This can take a few moments.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {method === 'saved' ? (
                <div>
                  <h3 className="font-semibold">Add from saved foods</h3>
                  <TextInput
                    className="mt-3"
                    type="search"
                    value={term}
                    placeholder="Search your foods"
                    aria-label="Search saved foods"
                    onChange={(event) => setTerm(event.target.value)}
                  />
                  <ul className="mt-2 divide-y divide-line">
                    {(foods ?? []).map((food) => (
                      <li key={food.id} className="flex items-center gap-2 py-2">
                        <span className="min-w-0 flex-1 truncate text-sm">{food.name}</span>
                        <Button
                          size="sm"
                          onClick={() => {
                            setComponents((items) => [...items, componentFromFood(food)]);
                            setName((value) => value || food.name);
                          }}
                        >
                          Add
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {method === 'barcode' ? (
                <div>
                  <h3 className="font-semibold">Scan or type a barcode</h3>
                  <p className="mt-1 text-sm text-ink-3">
                    You will still review the item and nutrition below.
                  </p>
                  <Button className="mt-3" onClick={() => setScannerOpen(true)}>
                    <IconBarcode />
                    Open scanner
                  </Button>
                </div>
              ) : null}
              {method === 'manual' ? (
                <div>
                  <h3 className="font-semibold">Manual item</h3>
                  <p className="mt-1 text-sm text-ink-3">
                    Add a blank item, then enter its amount and label nutrition.
                  </p>
                  <Button
                    className="mt-3"
                    onClick={() => setComponents((items) => [...items, blankComponent()])}
                  >
                    <IconPlus />
                    Add blank item
                  </Button>
                </div>
              ) : null}
              {method === 'drink' ? (
                <div>
                  <h3 className="font-semibold">Add a drink</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => addDrink('water', 250)}>250 ml glass of water</Button>
                    <Button onClick={() => addDrink('custom', 330)}>330 ml can</Button>
                    <Button onClick={() => addDrink('custom', 500)}>500 ml bottle</Button>
                    <Button onClick={() => addDrink('protein', 330)}>Protein shake</Button>
                    <Button onClick={() => addDrink('nutrition', 500)}>Nutrition drink</Button>
                    <Button onClick={() => addDrink('custom', 250)}>Custom drink</Button>
                  </div>
                </div>
              ) : null}
            </section>

            {error ? (
              <div className="mt-4">
                <Callout tone="error">{error}</Callout>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              {components.map((component) => (
                <ComponentEditor
                  key={component.key}
                  component={component}
                  onChange={(next) =>
                    setComponents((items) =>
                      items.map((item) => (item.key === component.key ? next : item)),
                    )
                  }
                  onRemove={() =>
                    setComponents((items) => items.filter((item) => item.key !== component.key))
                  }
                />
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-md border border-line bg-surface p-4 lg:col-span-2 lg:sticky lg:top-4">
            <p className="eyebrow">Meal total</p>
            <p className="numeric mt-2 text-3xl font-semibold">
              {Math.round(totals.calories)}{' '}
              <span className="text-sm font-normal text-ink-3">kcal</span>
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-ink-3">Protein</dt>
                <dd>{totals.protein.toFixed(1)} g</dd>
              </div>
              <div>
                <dt className="text-ink-3">Carbs</dt>
                <dd>{totals.carbs.toFixed(1)} g</dd>
              </div>
              <div>
                <dt className="text-ink-3">Fat</dt>
                <dd>{totals.fat.toFixed(1)} g</dd>
              </div>
            </dl>
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-medium text-accent">More nutrition</summary>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-ink-3">Fibre</dt>
                  <dd>{totals.fibre.toFixed(1)} g</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Sugars</dt>
                  <dd>{totals.sugars.toFixed(1)} g</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Saturated fat</dt>
                  <dd>{totals.saturatedFat.toFixed(1)} g</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Salt</dt>
                  <dd>{totals.salt.toFixed(1)} g</dd>
                </div>
              </dl>
            </details>
            <p className="mt-4 text-xs text-ink-3">
              {components.length} {components.length === 1 ? 'item' : 'items'}. AI and portion
              estimates are uncertain until you verify them.
            </p>
          </aside>
        </div>
      </Dialog>

      {scannerOpen ? (
        <Suspense fallback={null}>
          <BarcodeScanner
            open
            onClose={() => setScannerOpen(false)}
            onBarcode={(barcode) => void handleBarcode(barcode)}
            busy={busy}
            {...(error ? { lookupError: error } : {})}
          />
        </Suspense>
      ) : null}
    </>
  );
}
