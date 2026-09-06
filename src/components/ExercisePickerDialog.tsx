import { useMemo, useState } from 'react';
import { EXERCISES, primaryMachineForExercise } from '../data/exercises';
import type { ExerciseDefinition } from '../types';
import { Dialog } from './Dialog';
import { ExerciseDetailDialog } from './ExerciseDetailDialog';
import { Button, Field, TextInput } from './ui';

export function ExercisePickerDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (exercise: ExerciseDefinition) => void;
}) {
  const [query, setQuery] = useState('');
  const [details, setDetails] = useState<ExerciseDefinition | null>(null);
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return EXERCISES;
    return EXERCISES.filter((exercise) => {
      const machine = primaryMachineForExercise(exercise);
      return [exercise.name, exercise.equipment, machine?.displayName, ...exercise.primaryMuscles]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term));
    });
  }, [query]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Add exercise"
        description="Choose from the confirmed machines or a small set of free-weight and bodyweight movements."
        size="wide"
        footer={<Button onClick={onClose}>Close</Button>}
      >
        <Field label="Search exercises">
          {({ id, describedBy }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              data-autofocus
            />
          )}
        </Field>
        <p className="mt-3 text-xs text-ink-3" role="status">
          {results.length} {results.length === 1 ? 'exercise' : 'exercises'}
        </p>
        <div className="mt-3 grid gap-2">
          {results.map((exercise) => {
            const machine = primaryMachineForExercise(exercise);
            return (
              <article
                key={exercise.id}
                className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-3"
              >
                <div className="min-w-0">
                  <h3 className="font-medium text-ink">{exercise.name}</h3>
                  <p className="mt-1 text-xs text-ink-3">
                    {machine?.displayName ?? exercise.equipment} ·{' '}
                    {exercise.primaryMuscles.join(', ')}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="quiet" size="sm" onClick={() => setDetails(exercise)}>
                    Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onAdd(exercise);
                      onClose();
                    }}
                  >
                    Add
                  </Button>
                </div>
              </article>
            );
          })}
          {results.length === 0 ? (
            <p className="rounded-md border border-line bg-sunken p-4 text-sm text-ink-2">
              No exercise matches that search. Try a muscle, machine, or exercise name.
            </p>
          ) : null}
        </div>
      </Dialog>

      <ExerciseDetailDialog
        exercise={
          details
            ? {
                id: details.id,
                exerciseId: details.id,
                name: details.name,
                equipment: details.equipment,
                machineIds: [...details.machineIds],
                sets: 3,
                repsMin: 8,
                repsMax: 12,
                restSeconds: 90,
              }
            : null
        }
        onClose={() => setDetails(null)}
      />
    </>
  );
}
