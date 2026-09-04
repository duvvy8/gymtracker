import { useState } from 'react';
import { deleteFood } from '../db/queries';
import { formatCalories } from '../lib/nutrition';
import { MacroSummary } from './MacroSummary';
import { IconEdit, IconTrash } from './icons';
import { Button, EmptyState } from './ui';
import type { Food } from '../types';

/**
 * Saved foods, with the actions that apply to a food rather than to a log
 * entry: log it, edit it, remove it from the list.
 *
 * Deleting a food never touches entries already logged from it. Those hold
 * their own copy of the figures.
 */
export function FoodResultList({
  foods,
  onLog,
  onEdit,
  onDeleted,
  emptyTitle,
  emptyBody,
  emptyAction,
}: {
  foods: Food[];
  onLog: (food: Food) => void;
  onEdit: (food: Food) => void;
  onDeleted: (message: string) => void;
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: React.ReactNode;
}) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  if (foods.length === 0) {
    return (
      <EmptyState title={emptyTitle} action={emptyAction}>
        {emptyBody}
      </EmptyState>
    );
  }

  async function handleDelete(food: Food) {
    if (food.id === undefined) return;
    await deleteFood(food.id);
    setConfirmingId(null);
    onDeleted(`${food.name} removed from your foods.`);
  }

  return (
    <ul className="divide-y divide-line">
      {foods.map((food) => {
        const confirming = confirmingId === food.id;

        return (
          <li key={food.id} className="px-4 py-3 sm:px-5">
            {/* Calories sit in the right column rather than in the text run.
                Keeping them out of the wrapping line is what stops the macro
                summary breaking mid-sequence on a narrow screen. */}
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{food.name}</p>
                <p className="mt-0.5 text-xs text-ink-3">
                  {food.brand ? `${food.brand} · ` : ''}
                  {food.servingLabel}
                  {food.source === 'openfoodfacts' ? ' · from Open Food Facts' : ''}
                </p>
                <MacroSummary
                  protein={food.protein}
                  carbs={food.carbs}
                  fat={food.fat}
                  className="mt-1"
                />
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="numeric text-sm font-semibold text-ink">
                  {formatCalories(food.calories)}
                  <span className="text-xs font-normal text-ink-3"> kcal</span>
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="primary" onClick={() => onLog(food)}>
                    Log
                  </Button>
                  <Button
                    variant="quiet"
                    size="icon"
                    onClick={() => onEdit(food)}
                    aria-label={`Edit ${food.name}`}
                  >
                    <IconEdit />
                  </Button>
                  <Button
                    variant="quiet"
                    size="icon"
                    onClick={() => setConfirmingId(food.id ?? null)}
                    aria-label={`Delete ${food.name}`}
                  >
                    <IconTrash />
                  </Button>
                </div>
              </div>
            </div>

            {confirming ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-line bg-sunken px-3 py-2">
                <p className="mr-auto text-sm text-ink">
                  Remove this food? Entries already logged keep their figures.
                </p>
                <Button size="sm" onClick={() => setConfirmingId(null)}>
                  Keep it
                </Button>
                <Button size="sm" variant="danger" onClick={() => void handleDelete(food)}>
                  Remove
                </Button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
