import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { listWorkoutPlans } from '../db/queries';
import type { WorkoutCreationMode, WorkoutPlan } from '../types';
import { ProgramBuilder } from '../components/ProgramBuilder';
import { IconPrograms } from '../components/icons';
import { Button, Card, PageHeader } from '../components/ui';
import { EXPERIENCE_LABELS, GOAL_LABELS } from '../lib/planner';
import { useAppStore } from '../lib/store';

export function ProgramsPage() {
  const plans = useLiveQuery(() => listWorkoutPlans(), []);
  const showNotice = useAppStore((state) => state.showNotice);
  const [mode, setMode] = useState<WorkoutCreationMode | null>(null);
  const [editing, setEditing] = useState<WorkoutPlan | undefined>();

  const closeBuilder = () => {
    setMode(null);
    setEditing(undefined);
  };

  if (mode || editing) {
    return (
      <>
        <PageHeader
          title="Programs"
          description="Build each training day, then save it in this browser."
        />
        <ProgramBuilder
          mode={editing?.creationMode ?? mode ?? 'manual'}
          existing={editing}
          onDone={closeBuilder}
          onCancel={closeBuilder}
          onNotice={showNotice}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Programs"
        description="Create a reusable training plan around the days and equipment available to you."
      />
      <div className="grid gap-5">
        <section className="grid gap-4 md:grid-cols-2" aria-labelledby="create-program-heading">
          <h2 id="create-program-heading" className="sr-only">
            Create a program
          </h2>
          <Card className="p-4 sm:p-5">
            <p className="eyebrow">Full control</p>
            <h3 className="mt-1 text-lg font-semibold">Build manually</h3>
            <p className="mt-2 text-sm text-ink-2">
              Choose every day, exercise, set, rep range and rest time yourself.
            </p>
            <Button variant="primary" className="mt-4" onClick={() => setMode('manual')}>
              Build manually
            </Button>
          </Card>
          <Card className="p-4 sm:p-5">
            <p className="eyebrow">Local rules</p>
            <h3 className="mt-1 text-lg font-semibold">Create a draft</h3>
            <p className="mt-2 text-sm text-ink-2">
              Get a deterministic starting point from your goal, schedule and machines, then edit it
              before saving. No AI or network request is used.
            </p>
            <Button className="mt-4" onClick={() => setMode('automated')}>
              Create local draft
            </Button>
          </Card>
        </section>

        <section aria-labelledby="saved-programs-heading">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="saved-programs-heading" className="text-xl font-semibold">
              Saved programs
            </h2>
            {plans ? <span className="numeric text-xs text-ink-3">{plans.length}</span> : null}
          </div>
          {!plans ? (
            <p role="status" className="text-sm text-ink-3">
              Loading your programs.
            </p>
          ) : plans.length === 0 ? (
            <Card className="p-6 text-center">
              <IconPrograms className="mx-auto text-accent" width="28" height="28" />
              <h3 className="mt-3 font-semibold">No saved programs</h3>
              <p className="mx-auto mt-2 max-w-(--container-measure) text-sm text-ink-2">
                Build one manually or create a local draft. Your program stays in this browser and
                remains editable.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {plans.map((plan) => (
                <Card key={plan.id} as="article" className="p-4">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="mt-1 text-sm text-ink-3">
                        {GOAL_LABELS[plan.goal]} · {EXPERIENCE_LABELS[plan.experience]}
                      </p>
                    </div>
                    <span className="text-xs text-ink-3">
                      {plan.creationMode === 'automated' ? 'Local draft' : 'Manual'}
                    </span>
                  </div>
                  <p className="numeric mt-4 text-sm text-ink-2">
                    {plan.days.length} days ·{' '}
                    {plan.days.reduce((sum, day) => sum + day.exercises.length, 0)} exercises ·{' '}
                    {plan.sessionMinutes} min
                  </p>
                  <Button className="mt-4" onClick={() => setEditing(plan)}>
                    View and edit
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
