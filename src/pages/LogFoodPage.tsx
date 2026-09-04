import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { searchFoods } from '../db/queries';
import { useAppStore } from '../lib/store';
import { DateStepper } from '../components/DateStepper';
import { FoodForm } from '../components/FoodForm';
import { EMPTY_FOOD_FORM, foodToFormValues, type FoodFormValues } from '../lib/foodFormValues';
import { FoodResultList } from '../components/FoodResultList';
import { LogEntryDialog } from '../components/LogEntryDialog';
import { IconClose, IconPlus, IconSearch } from '../components/icons';
import { Button, Card, CardHeader, PageHeader, TextInput } from '../components/ui';
import type { Food } from '../types';

type Editor = { values: FoodFormValues; foodId?: number } | null;

export function LogFoodPage() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const showNotice = useAppStore((state) => state.showNotice);

  const [term, setTerm] = useState('');
  const [editor, setEditor] = useState<Editor>(null);
  const [logging, setLogging] = useState<Food | null>(null);

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

  return (
    <>
      <PageHeader
        title="Log food"
        description="Search what you have saved, or add something new."
        actions={<DateStepper />}
      />

      <div className="grid gap-5">
        <Card>
          <CardHeader
            title="Your foods"
            description="Search by name or brand"
            actions={
              <Button variant="primary" onClick={openNewFoodForm}>
                <IconPlus />
                Add a food
              </Button>
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
              description="Figures are per serving, as written on the label."
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
              onSaved={(_id, message) => {
                showNotice(message);
                setEditor(null);
              }}
              onCancel={() => setEditor(null)}
            />
          </Card>
        ) : null}
      </div>

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
