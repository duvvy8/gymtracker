import { useState } from 'react';
import { deleteFoodLog } from '../db/queries';
import { formatAmount, formatCalories } from '../lib/nutrition';
import { MacroSummary } from './MacroSummary';
import { IconEdit, IconTrash } from './icons';
import { Button, EmptyState } from './ui';
import type { FoodLog } from '../types';

/**
 * The day's entries.
 *
 * Deleting asks for confirmation in the row itself rather than in a modal.
 * It keeps the entry being deleted visible while the question is asked,
 * which a dialog covering the list does not.
 */
export function FoodLogList({
  logs,
  onEdit,
  onDeleted,
  emptyAction,
}: {
  logs: FoodLog[];
  onEdit: (log: FoodLog) => void;
  onDeleted: (message: string) => void;
  emptyAction?: React.ReactNode;
}) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  if (logs.length === 0) {
    return (
      <EmptyState title="No food logged for this day" action={emptyAction}>
        Entries you add will be listed here with their calories and macros.
      </EmptyState>
    );
  }

  async function handleDelete(log: FoodLog) {
    if (log.id === undefined) return;
    await deleteFoodLog(log.id);
    setConfirmingId(null);
    onDeleted(`${log.name} removed from the log.`);
  }

  return (
    <ul className="divide-y divide-line">
      {logs.map((log) => {
        const confirming = confirmingId === log.id;

        return (
          <li key={log.id} className="px-4 py-3 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{log.name}</p>
                <p className="mt-0.5 text-xs text-ink-3">
                  {log.brand ? `${log.brand} · ` : ''}
                  {formatAmount(log.amount, log.unit, log.servingLabel)}
                </p>
                <MacroSummary
                  protein={log.protein}
                  carbs={log.carbs}
                  fat={log.fat}
                  className="mt-1"
                />
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="numeric text-sm font-semibold text-ink">
                  {formatCalories(log.calories)}
                  <span className="text-xs font-normal text-ink-3"> kcal</span>
                </p>
                {!confirming ? (
                  <div className="flex">
                    <Button
                      variant="quiet"
                      size="icon"
                      onClick={() => onEdit(log)}
                      aria-label={`Edit ${log.name}`}
                    >
                      <IconEdit />
                    </Button>
                    <Button
                      variant="quiet"
                      size="icon"
                      onClick={() => setConfirmingId(log.id ?? null)}
                      aria-label={`Delete ${log.name}`}
                    >
                      <IconTrash />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            {confirming ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-line bg-sunken px-3 py-2">
                <p className="mr-auto text-sm text-ink">Remove this entry?</p>
                <Button size="sm" onClick={() => setConfirmingId(null)}>
                  Keep it
                </Button>
                <Button size="sm" variant="danger" onClick={() => void handleDelete(log)}>
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
