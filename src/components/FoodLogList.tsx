import { useState } from 'react';
import { deleteFoodLog } from '../db/queries';
import { formatAmount, formatCalories } from '../lib/nutrition';
import { MacroSummary } from './MacroSummary';
import { IconEdit, IconTrash } from './icons';
import { Button, Callout, EmptyState } from './ui';
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
  loading = false,
  onEdit,
  onDeleted,
  emptyAction,
}: {
  logs: FoodLog[];
  /** True until the query resolves, so "empty" is never shown for "not yet known". */
  loading?: boolean;
  onEdit: (log: FoodLog) => void;
  onDeleted: (message: string) => void;
  emptyAction?: React.ReactNode;
}) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  if (loading) {
    return (
      <p role="status" className="px-4 py-10 text-center text-sm text-ink-3 sm:px-6">
        Loading today&apos;s entries.
      </p>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState title="Nothing logged yet" action={emptyAction}>
        Start with a recent food, search your saved foods, or scan a barcode. Entries appear here
        with their calories and macros.
      </EmptyState>
    );
  }

  /**
   * Guarded against a second click while the first delete is in flight, and
   * the failure path reports rather than leaving the row silently unchanged.
   */
  async function handleDelete(log: FoodLog) {
    if (log.id === undefined || deletingId !== null) return;
    setDeletingId(log.id);
    setError(undefined);
    try {
      await deleteFoodLog(log.id);
      setConfirmingId(null);
      onDeleted(`${log.name} removed from the log.`);
    } catch {
      setError('That entry could not be removed. Try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ul className="divide-y divide-line">
      {logs.map((log) => {
        const confirming = confirmingId === log.id;
        const busy = deletingId === log.id;

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
                {/*
                  The action row stays mounted while the confirmation is open.
                  Unmounting it would destroy the button the user just pressed,
                  dropping focus to <body> so the next Tab restarts from the top
                  of the page.
                */}
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
                    aria-label={`Remove ${log.name}`}
                  >
                    <IconTrash />
                  </Button>
                </div>
              </div>
            </div>

            {confirming ? (
              <div className="mt-3 rounded-md border border-line bg-sunken px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="mr-auto text-sm text-ink">Remove this entry?</p>
                  <Button size="sm" onClick={() => setConfirmingId(null)} disabled={busy}>
                    Keep it
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => void handleDelete(log)}
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
