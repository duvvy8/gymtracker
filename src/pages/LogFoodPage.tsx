import { lazy, Suspense, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { findFoodByBarcode, searchFoods } from '../db/queries';
import { lookupBarcode } from '../lib/openFoodFacts';
import { useAppStore } from '../lib/store';
import { EMPTY_FOOD_FORM, foodToFormValues, type FoodFormValues } from '../lib/foodFormValues';
import { DateStepper } from '../components/DateStepper';
import { FoodForm } from '../components/FoodForm';
import { FoodResultList } from '../components/FoodResultList';
import { LogEntryDialog } from '../components/LogEntryDialog';
import { IconBarcode, IconClose, IconPlus, IconSearch } from '../components/icons';
import { Button, Card, CardHeader, PageHeader, TextInput } from '../components/ui';
import type { Food, FoodSource } from '../types';

/**
 * The scanner carries the ZXing decoder, which is large and is needed only
 * when someone actually scans something. It is loaded on demand and mounted
 * only while open, so the decoder never enters the initial download and the
 * camera cleanup on unmount stays the single release path.
 */
const BarcodeScanner = lazy(() =>
  import('../components/BarcodeScanner').then((module) => ({ default: module.BarcodeScanner })),
);

type Editor = {
  values: FoodFormValues;
  foodId?: number;
  source?: FoodSource;
  barcode?: string;
} | null;

export function LogFoodPage() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const showNotice = useAppStore((state) => state.showNotice);

  const [term, setTerm] = useState('');
  const [editor, setEditor] = useState<Editor>(null);
  const [logging, setLogging] = useState<Food | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | undefined>(undefined);

  const results = useLiveQuery(() => searchFoods(term, 40), [term]);
  const searching = term.trim() !== '';

  const emptyBody = useMemo(
    () =>
      searching
        ? 'Nothing in your list matches that. Add it as a new food and it will be here next time.'
        : 'Foods you save are listed here, most recent first.',
    [searching],
  );

  function openNewFoodForm() {
    setEditor({ values: EMPTY_FOOD_FORM });
  }

  function openScanner() {
    setLookupError(undefined);
    setScannerOpen(true);
  }

  /**
   * A scanned or typed barcode.
   *
   * The local list is checked first, so a product already saved costs no
   * network request at all. A remote result prefills the food form rather
   * than saving straight to the database: Open Food Facts records are
   * community edited and often incomplete, so the figures are put in front
   * of the user before anything is stored.
   */
  async function handleBarcode(barcode: string) {
    setLookupBusy(true);
    setLookupError(undefined);

    try {
      const existing = await findFoodByBarcode(barcode);
      if (existing) {
        setScannerOpen(false);
        setLogging(existing);
        return;
      }

      const result = await lookupBarcode(barcode);

      if (result.outcome === 'found') {
        setScannerOpen(false);
        setEditor({ values: result.values, source: 'openfoodfacts', barcode: result.barcode });
        showNotice(
          result.missingNutrition
            ? 'Found it, but Open Food Facts is missing some figures. Fill in the gaps before saving.'
            : `Found ${result.values.name}. Check the figures, then save.`,
        );
        return;
      }

      if (result.outcome === 'not-found') {
        setScannerOpen(false);
        setEditor({ values: { ...EMPTY_FOOD_FORM }, source: 'custom', barcode: result.barcode });
        showNotice('Not in Open Food Facts. Enter it by hand and the barcode will be kept.');
        return;
      }

      setLookupError(result.message);
    } finally {
      setLookupBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Log food"
        description="Search what you have saved, scan a barcode, or add something new."
        actions={<DateStepper />}
      />

      <div className="grid gap-5">
        <Card>
          <CardHeader
            title="Your foods"
            description="Search by name or brand"
            actions={
              <>
                <Button onClick={openScanner}>
                  <IconBarcode />
                  Scan
                </Button>
                <Button variant="primary" onClick={openNewFoodForm}>
                  <IconPlus />
                  Add a food
                </Button>
              </>
            }
          />

          <div className="p-4 sm:p-5">
            <div className="relative">
              <IconSearch
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                aria-hidden="true"
              />
              <TextInput
                type="search"
                className="pl-10"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search your foods"
                aria-label="Search your foods"
                maxLength={120}
              />
            </div>
          </div>

          <FoodResultList
            foods={results ?? []}
            onLog={(food) => setLogging(food)}
            onEdit={(food) =>
              setEditor({
                values: foodToFormValues(food),
                ...(food.id === undefined ? {} : { foodId: food.id }),
                source: food.source,
                ...(food.barcode ? { barcode: food.barcode } : {}),
              })
            }
            onDeleted={(message) => showNotice(message)}
            emptyTitle={searching ? 'No matches' : 'No foods saved yet'}
            emptyBody={emptyBody}
            emptyAction={
              <Button variant="primary" onClick={openNewFoodForm}>
                <IconPlus />
                Add a food
              </Button>
            }
          />
        </Card>

        {editor ? (
          <Card>
            <CardHeader
              title={editor.foodId ? 'Edit food' : 'Add a food'}
              description={
                editor.barcode
                  ? `Barcode ${editor.barcode}. Figures from Open Food Facts are per 100 g.`
                  : 'Figures are per serving, as written on the label.'
              }
              actions={
                <Button
                  variant="quiet"
                  size="icon"
                  onClick={() => setEditor(null)}
                  aria-label="Close"
                >
                  <IconClose />
                </Button>
              }
            />
            <FoodForm
              initialValues={editor.values}
              {...(editor.foodId === undefined ? {} : { foodId: editor.foodId })}
              {...(editor.source ? { source: editor.source } : {})}
              {...(editor.barcode ? { barcode: editor.barcode } : {})}
              onSaved={(_id, message) => {
                showNotice(message);
                setEditor(null);
              }}
              onCancel={() => setEditor(null)}
            />
          </Card>
        ) : null}
      </div>

      {scannerOpen ? (
        <Suspense fallback={null}>
          <BarcodeScanner
            open
            onClose={() => setScannerOpen(false)}
            onBarcode={(barcode) => void handleBarcode(barcode)}
            busy={lookupBusy}
            {...(lookupError ? { lookupError } : {})}
          />
        </Suspense>
      ) : null}

      <LogEntryDialog
        open={logging !== null}
        onClose={() => setLogging(null)}
        date={selectedDate}
        {...(logging ? { food: logging } : {})}
        onSaved={(message) => showNotice(message)}
      />
    </>
  );
}
