import { getExercise, primaryMachineForExercise } from '../data/exercises';
import type { PlannedExercise } from '../types';
import { Dialog } from './Dialog';
import { MachineImagePanel } from './MachineImagePanel';
import { MuscleEmphasisBars } from './MuscleEmphasisBars';
import { Button } from './ui';

export function ExerciseDetailDialog({
  exercise,
  onClose,
}: {
  exercise: PlannedExercise | null;
  onClose: () => void;
}) {
  const definition = exercise ? getExercise(exercise.exerciseId) : undefined;
  const machine = definition ? primaryMachineForExercise(definition) : undefined;

  return (
    <Dialog
      open={exercise !== null}
      onClose={onClose}
      title={exercise?.name ?? 'Exercise'}
      description={definition ? `${definition.equipment} exercise` : 'Saved exercise'}
      size="wide"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {exercise ? (
        <div className="grid min-w-0 gap-5 md:grid-cols-2">
          <div className="min-w-0">
            {machine ? (
              <MachineImagePanel machine={machine} detail />
            ) : (
              <div className="flex min-h-72 items-center justify-center rounded-md border border-line bg-sunken p-5">
                <p className="text-sm font-medium text-ink-3">Image coming soon</p>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-5">
            <section>
              <h3 className="text-base font-semibold">Planned work</h3>
              <p className="mt-2 numeric text-xl text-ink">
                {exercise.sets} × {exercise.repsMin}
                {exercise.repsMax === exercise.repsMin ? '' : ` to ${exercise.repsMax}`}
              </p>
              {exercise.restSeconds !== undefined ? (
                <p className="mt-1 text-sm text-ink-2">Rest {exercise.restSeconds} seconds</p>
              ) : null}
              {exercise.notes ? <p className="mt-2 text-sm text-ink-2">{exercise.notes}</p> : null}
            </section>

            {machine ? (
              <section>
                <div className="mb-3">
                  <h3 className="text-base font-semibold">Muscle emphasis</h3>
                  <p className="mt-1 text-xs text-ink-3">Approximate planning guide</p>
                </div>
                <MuscleEmphasisBars items={machine.emphasis} />
              </section>
            ) : definition ? (
              <section>
                <h3 className="text-base font-semibold">Muscles</h3>
                <p className="mt-2 text-sm text-ink-2">
                  {definition.primaryMuscles.join(', ')}
                  {definition.secondaryMuscles.length > 0
                    ? `. Also uses ${definition.secondaryMuscles.join(', ')}.`
                    : '.'}
                </p>
              </section>
            ) : null}

            {definition ? (
              <section>
                <h3 className="text-base font-semibold">Set up and perform</h3>
                <p className="mt-2 text-sm text-ink-2">{definition.setup}</p>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-2">
                  {definition.instructions.map((instruction) => (
                    <li key={instruction}>{instruction}</li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
