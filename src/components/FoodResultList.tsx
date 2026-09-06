import { useState } from 'react';
import { deleteFood } from '../db/queries';
import { formatCalories } from '../lib/nutrition';
import { MacroSummary } from './MacroSummary';
import { IconEdit, IconTrash } from './icons';
import { Button, Callout, EmptyState } from './ui';
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
  loading = false,
  onLog,
  onEdit,
  onDeleted,
  emptyTitle,
  emptyBody,
  emptyAction,
}: {
  foods: Food[];
  /** True until the query resolves, so "empty" is never shown for "not yet known". */
  loading?: boolean;
  onLog: (food: Food) => void;
  onEdit: (food: Food) => void;
  onDeleted: (message: string) => void;
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: React.ReactNode;
}) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  if (loading) {
    return (
      <p role="status" className="px-4 py-10 text-center text-sm text-ink-3 sm:px-6">
        Searching your foods.
      </p>
    );
  }

  if (foods.length === 0) {
    return (
      <EmptyState title={emptyTitle} action={emptyAction}>
        {emptyBody}
      </EmptyState>
    );
  }

  async function handleDelete(food: Food) {
    if (food.id === undefined || deletingId !== null) return;
    setDeletingId(food.id);
    setError(undefined);
    try {
      await deleteFood(food.id);
      setConfirmingId(null);
      onDeleted(`${food.name} removed from your foods.`);
    } catch {
      setError('That food could not be removed. Try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ul className="divide-y divide-line">
      {foods.map((food) => {
        const confirming = confirmingId === food.id;
        const busy = deletingId === food.id;

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
                    <span className="sr-only"> {food.name}</span>
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
                    aria-label={`Remove ${food.name}`}
                  >
                    <IconTrash />
                  </Button>
                </div>
              </div>
            </div>

            {confirming ? (
              <div className="mt-3 rounded-md border border-line bg-sunken px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="mr-auto text-sm text-ink">
                    Remove this food? Entries already logged keep their figures.
                  </p>
                  <Button size="sm" onClick={() => setConfirmingId(null)} disabled={busy}>
                    Keep it
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => void handleDelete(food)}
                    disabled={busy}
                  >
                    {busy ? 'Removing' : 'Remove'}
                  </Button>
                </div>
                {error ? (
                  <div className="mt-2">
                    <Callout tone="error">{error}</Callout>
                  </div>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
