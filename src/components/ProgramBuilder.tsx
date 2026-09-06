import { useMemo, useState } from 'react';
import { MACHINE_REGIONS, MACHINES } from '../data/machines';
import { deleteWorkoutPlan, saveWorkoutPlan, type WorkoutPlanDraft } from '../db/queries';
import { LIMITS } from '../lib/limits';
import {
  createManualDraft,
  EXPERIENCE_LABELS,
  GOAL_LABELS,
  localPlanner,
  plannedExercise,
  WEEKDAYS,
} from '../lib/planner';
import { isValidationError } from '../lib/validation';
import type {
  ExerciseDefinition,
  ExperienceLevel,
  MachineId,
  MachineRegion,
  PlannedExercise,
  PlannerPreferences,
  Weekday,
  WorkoutCreationMode,
  WorkoutGoal,
  WorkoutPlan,
} from '../types';
import { ExerciseDetailDialog } from './ExerciseDetailDialog';
import { ExercisePickerDialog } from './ExercisePickerDialog';
import { IconArrowDown, IconArrowUp, IconTrash } from './icons';
import { Button, Callout, Card, Field, NumberInput, Select, TextInput } from './ui';

type Stage = 'setup' | 'schedule' | 'edit' | 'review';

const ALL_MACHINE_IDS = MACHINES.map((machine) => machine.id);

function integerInput(raw: string): number | undefined {
  if (!/^\d+$/.test(raw)) return raw === '' ? 0 : undefined;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : undefined;
}

function defaultPreferences(): PlannerPreferences {
  return {
    name: 'My program',
    goal: 'general',
    experience: 'beginner',
    sessionMinutes: 45,
    trainingDays: ['mon', 'wed', 'fri'],
    priorityRegions: [],
    availableMachineIds: [...ALL_MACHINE_IDS],
  };
}

function preferencesFromPlan(plan: WorkoutPlan): PlannerPreferences {
  return {
    name: plan.name,
    goal: plan.goal,
    experience: plan.experience,
    sessionMinutes: plan.sessionMinutes,
    trainingDays: plan.days.map((day) => day.weekday),
    priorityRegions: [...plan.priorityRegions],
    availableMachineIds: [...plan.availableMachineIds],
  };
}

function editablePlan(plan: WorkoutPlan): WorkoutPlanDraft {
  return {
    id: plan.id,
    name: plan.name,
    creationMode: plan.creationMode,
    goal: plan.goal,
    experience: plan.experience,
    sessionMinutes: plan.sessionMinutes,
    priorityRegions: [...plan.priorityRegions],
    availableMachineIds: [...plan.availableMachineIds],
    days: plan.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        machineIds: [...exercise.machineIds],
      })),
    })),
  };
}

function StepRail({ stage }: { stage: Stage }) {
  const stages: { id: Stage; label: string }[] = [
    { id: 'setup', label: 'Basics' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'edit', label: 'Exercises' },
    { id: 'review', label: 'Review' },
  ];
  const current = stages.findIndex((entry) => entry.id === stage);
  return (
    <ol className="mb-5 grid grid-cols-4 gap-1" aria-label="Program setup progress">
      {stages.map((entry, index) => (
        <li
          key={entry.id}
          className={`border-t-2 pt-2 text-center text-xs font-medium ${index <= current ? 'border-accent text-accent' : 'border-line text-ink-3'}`}
          aria-current={entry.id === stage ? 'step' : undefined}
        >
          {entry.label}
        </li>
      ))}
    </ol>
  );
}

export function ProgramBuilder({
  mode,
  existing,
  onDone,
  onCancel,
  onNotice,
}: {
  mode: WorkoutCreationMode;
  existing?: WorkoutPlan;
  onDone: () => void;
  onCancel: () => void;
  onNotice: (message: string, tone?: 'info' | 'error') => void;
}) {
  const [stage, setStage] = useState<Stage>(existing ? 'edit' : 'setup');
  const [preferences, setPreferences] = useState<PlannerPreferences>(() =>
    existing ? preferencesFromPlan(existing) : defaultPreferences(),
  );
  const [draft, setDraft] = useState<WorkoutPlanDraft | null>(() =>
    existing ? editablePlan(existing) : null,
  );
  const [activeDayId, setActiveDayId] = useState(existing?.days[0]?.id ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [details, setDetails] = useState<PlannedExercise | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeDay = draft?.days.find((day) => day.id === activeDayId) ?? draft?.days[0];
  const heading = existing
    ? `Edit ${existing.name}`
    : mode === 'manual'
      ? 'Build manually'
      : 'Create a local draft';

  function toggleDay(day: Weekday) {
    setPreferences((current) => ({
      ...current,
      trainingDays: current.trainingDays.includes(day)
        ? current.trainingDays.filter((entry) => entry !== day)
        : WEEKDAYS.filter((entry) => [...current.trainingDays, day].includes(entry.id)).map(
            (entry) => entry.id,
          ),
    }));
  }

  function toggleRegion(region: MachineRegion) {
    setPreferences((current) => ({
      ...current,
      priorityRegions: current.priorityRegions.includes(region)
        ? current.priorityRegions.filter((entry) => entry !== region)
        : [...current.priorityRegions, region],
    }));
  }

  function toggleMachine(id: MachineId) {
    setPreferences((current) => ({
      ...current,
      availableMachineIds: current.availableMachineIds.includes(id)
        ? current.availableMachineIds.filter((entry) => entry !== id)
        : [...current.availableMachineIds, id],
    }));
  }

  async function createDraft() {
    if (preferences.trainingDays.length === 0) {
      setError('Choose at least one training day.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      if (
        !Number.isFinite(preferences.sessionMinutes) ||
        preferences.sessionMinutes < LIMITS.sessionMinutesMin ||
        preferences.sessionMinutes > LIMITS.sessionMinutesMax
      ) {
        setError('Enter a session duration from 15 to 180 minutes.');
        return;
      }
      const generated =
        mode === 'manual'
          ? createManualDraft(preferences)
          : await localPlanner.generate(preferences);
      const next = draft
        ? {
            ...draft,
            name: preferences.name,
            goal: preferences.goal,
            experience: preferences.experience,
            sessionMinutes: preferences.sessionMinutes,
            priorityRegions: [...preferences.priorityRegions],
            availableMachineIds: [...preferences.availableMachineIds],
            days: generated.days.map(
              (day) => draft.days.find((saved) => saved.weekday === day.weekday) ?? day,
            ),
          }
        : generated;
      setDraft(next);
      setActiveDayId(next.days[0]?.id ?? '');
      setStage('edit');
    } finally {
      setBusy(false);
    }
  }

  function updateDay(
    dayId: string,
    mutate: (day: WorkoutPlanDraft['days'][number]) => WorkoutPlanDraft['days'][number],
  ) {
    setDraft((current) =>
      current
        ? { ...current, days: current.days.map((day) => (day.id === dayId ? mutate(day) : day)) }
        : current,
    );
  }

  function updateExercise(dayId: string, exerciseId: string, patch: Partial<PlannedExercise>) {
    updateDay(dayId, (day) => ({
      ...day,
      exercises: day.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...patch } : exercise,
      ),
    }));
  }

  function addExercise(definition: ExerciseDefinition) {
    if (!activeDay) return;
    updateDay(activeDay.id, (day) => ({
      ...day,
      exercises: [
        ...day.exercises,
        {
          ...plannedExercise(
            definition,
            day.exercises.length,
            day.id,
            preferences.goal,
            preferences.experience,
          ),
          id: crypto.randomUUID(),
        },
      ],
    }));
  }

  function moveExercise(index: number, direction: -1 | 1) {
    if (!activeDay) return;
    const destination = index + direction;
    if (destination < 0 || destination >= activeDay.exercises.length) return;
    updateDay(activeDay.id, (day) => {
      const exercises = [...day.exercises];
      [exercises[index], exercises[destination]] = [exercises[destination]!, exercises[index]!];
      return { ...day, exercises };
    });
  }

  async function save() {
    if (!draft || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await saveWorkoutPlan(draft);
      onNotice(existing ? 'Program updated.' : 'Program saved.');
      onDone();
    } catch (cause) {
      setError(
        isValidationError(cause)
          ? cause.message
          : 'The program could not be saved. Check the values and try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function removePlan() {
    if (!existing?.id || busy) return;
    setBusy(true);
    try {
      await deleteWorkoutPlan(existing.id);
      onNotice('Program deleted.');
      onDone();
    } catch {
      setError('The program could not be deleted. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const totalExercises = useMemo(
    () => draft?.days.reduce((sum, day) => sum + day.exercises.length, 0) ?? 0,
    [draft],
  );

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">
            {mode === 'manual' ? 'Manual program' : 'Local rules-based draft'}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{heading}</h2>
        </div>
        <Button variant="quiet" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <StepRail stage={stage} />
      {error ? (
        <div className="mb-4">
          <Callout tone="error">{error}</Callout>
        </div>
      ) : null}

      {stage === 'setup' ? (
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            setError(undefined);
            setStage('schedule');
          }}
        >
          <Field label="Program name" className="md:col-span-2">
            {({ id, describedBy }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                maxLength={LIMITS.workoutNameMaxLength}
                value={preferences.name}
                onChange={(event) => setPreferences({ ...preferences, name: event.target.value })}
                required
                autoFocus
              />
            )}
          </Field>
          <Field label="Main goal">
            {({ id, describedBy }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                value={preferences.goal}
                onChange={(event) =>
                  setPreferences({ ...preferences, goal: event.target.value as WorkoutGoal })
                }
              >
                {Object.entries(GOAL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Experience">
            {({ id, describedBy }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                value={preferences.experience}
                onChange={(event) =>
                  setPreferences({
                    ...preferences,
                    experience: event.target.value as ExperienceLevel,
                  })
                }
              >
                {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Session duration" hint="Between 15 and 180 minutes">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={preferences.sessionMinutes}
                onChange={(event) => {
                  const value = integerInput(event.target.value);
                  if (value !== undefined)
                    setPreferences({ ...preferences, sessionMinutes: value });
                }}
                required
              />
            )}
          </Field>
          <div className="flex items-end justify-end md:col-span-2">
            <Button type="submit" variant="primary">
              Choose schedule
            </Button>
          </div>
        </form>
      ) : null}

      {stage === 'schedule' ? (
        <div className="grid gap-6">
          <fieldset>
            <legend className="text-sm font-semibold">Training days</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {WEEKDAYS.map((day) => (
                <label
                  key={day.id}
                  className="flex min-h-11 items-center gap-2 rounded-md border border-line-input bg-surface px-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={preferences.trainingDays.includes(day.id)}
                    onChange={() => toggleDay(day.id)}
                  />
                  {day.short}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold">Priority areas</legend>
            <p className="mt-1 text-xs text-ink-3">
              Optional. The local draft puts these areas first.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {MACHINE_REGIONS.map((region) => (
                <label
                  key={region}
                  className="flex min-h-11 items-center gap-2 rounded-md border border-line-input bg-surface px-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={preferences.priorityRegions.includes(region)}
                    onChange={() => toggleRegion(region)}
                  />
                  {region}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold">Available machines</legend>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs text-ink-3">
                Only selected machines are used in a local draft.
              </p>
              <Button
                size="sm"
                variant="quiet"
                onClick={() =>
                  setPreferences({
                    ...preferences,
                    availableMachineIds:
                      preferences.availableMachineIds.length === MACHINES.length
                        ? []
                        : [...ALL_MACHINE_IDS],
                  })
                }
              >
                {preferences.availableMachineIds.length === MACHINES.length
                  ? 'Clear all'
                  : 'Select all'}
              </Button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MACHINES.map((machine) => (
                <label
                  key={machine.id}
                  className="flex min-h-11 items-center gap-2 rounded-md border border-line-input bg-surface px-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={preferences.availableMachineIds.includes(machine.id)}
                    onChange={() => toggleMachine(machine.id)}
                  />
                  <span>{machine.displayName}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap justify-between gap-2">
            <Button onClick={() => setStage('setup')}>Back</Button>
            <Button variant="primary" disabled={busy} onClick={() => void createDraft()}>
              {busy
                ? 'Creating draft'
                : mode === 'manual'
                  ? 'Start adding exercises'
                  : 'Create local draft'}
            </Button>
          </div>
        </div>
      ) : null}

      {stage === 'edit' && draft ? (
        <div>
          <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Training days">
            {draft.days.map((day) => (
              <button
                key={day.id}
                type="button"
                aria-pressed={activeDay?.id === day.id}
                onClick={() => setActiveDayId(day.id)}
                className={`h-11 shrink-0 rounded-md border px-4 text-sm font-medium ${activeDay?.id === day.id ? 'border-accent bg-accent-weak text-accent' : 'border-line-input bg-surface text-ink-2'}`}
              >
                {WEEKDAYS.find((entry) => entry.id === day.weekday)?.short}
              </button>
            ))}
          </div>
          {activeDay ? (
            <section className="mt-3" aria-labelledby={`edit-${activeDay.id}`}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <Field label="Day name" className="min-w-0 flex-1">
                  {({ id, describedBy }) => (
                    <TextInput
                      id={id}
                      aria-describedby={describedBy}
                      value={activeDay.name}
                      maxLength={LIMITS.workoutDayNameMaxLength}
                      onChange={(event) =>
                        updateDay(activeDay.id, (day) => ({ ...day, name: event.target.value }))
                      }
                    />
                  )}
                </Field>
                <Button variant="primary" onClick={() => setPickerOpen(true)}>
                  Add exercise
                </Button>
              </div>
              <h3 id={`edit-${activeDay.id}`} className="sr-only">
                Exercises for {activeDay.name}
              </h3>
              <div className="mt-4 grid gap-3">
                {activeDay.exercises.map((exercise, index) => (
                  <article
                    key={exercise.id}
                    className="rounded-md border border-line bg-surface p-3"
                  >
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                      <button
                        type="button"
                        className="min-w-0 text-left font-semibold text-ink underline-offset-4 hover:underline"
                        onClick={() => setDetails(exercise)}
                      >
                        {index + 1}. {exercise.name}
                      </button>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="quiet"
                          aria-label={`Move ${exercise.name} up`}
                          disabled={index === 0}
                          onClick={() => moveExercise(index, -1)}
                        >
                          <IconArrowUp />
                        </Button>
                        <Button
                          size="icon"
                          variant="quiet"
                          aria-label={`Move ${exercise.name} down`}
                          disabled={index === activeDay.exercises.length - 1}
                          onClick={() => moveExercise(index, 1)}
                        >
                          <IconArrowDown />
                        </Button>
                        <Button
                          size="icon"
                          variant="quiet"
                          aria-label={`Remove ${exercise.name}`}
                          onClick={() =>
                            updateDay(activeDay.id, (day) => ({
                              ...day,
                              exercises: day.exercises.filter((entry) => entry.id !== exercise.id),
                            }))
                          }
                        >
                          <IconTrash />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Field label="Sets">
                        {({ id, describedBy }) => (
                          <NumberInput
                            id={id}
                            aria-describedby={describedBy}
                            value={exercise.sets}
                            onChange={(event) => {
                              const value = integerInput(event.target.value);
                              if (value !== undefined)
                                updateExercise(activeDay.id, exercise.id, { sets: value });
                            }}
                          />
                        )}
                      </Field>
                      <Field label="Min reps">
                        {({ id, describedBy }) => (
                          <NumberInput
                            id={id}
                            aria-describedby={describedBy}
                            value={exercise.repsMin}
                            onChange={(event) => {
                              const value = integerInput(event.target.value);
                              if (value !== undefined)
                                updateExercise(activeDay.id, exercise.id, { repsMin: value });
                            }}
                          />
                        )}
                      </Field>
                      <Field label="Max reps">
                        {({ id, describedBy }) => (
                          <NumberInput
                            id={id}
                            aria-describedby={describedBy}
                            value={exercise.repsMax}
                            onChange={(event) => {
                              const value = integerInput(event.target.value);
                              if (value !== undefined)
                                updateExercise(activeDay.id, exercise.id, { repsMax: value });
                            }}
                          />
                        )}
                      </Field>
                      <Field label="Rest seconds" hint="Optional">
                        {({ id, describedBy }) => (
                          <NumberInput
                            id={id}
                            aria-describedby={describedBy}
                            value={exercise.restSeconds ?? ''}
                            onChange={(event) => {
                              if (event.target.value === '') {
                                updateExercise(activeDay.id, exercise.id, {
                                  restSeconds: undefined,
                                });
                                return;
                              }
                              const value = integerInput(event.target.value);
                              if (value !== undefined)
                                updateExercise(activeDay.id, exercise.id, {
                                  restSeconds: value,
                                });
                            }}
                          />
                        )}
                      </Field>
                    </div>
                    <Field label="Notes" hint="Optional" className="mt-3">
                      {({ id, describedBy }) => (
                        <TextInput
                          id={id}
                          aria-describedby={describedBy}
                          maxLength={LIMITS.workoutNoteMaxLength}
                          value={exercise.notes ?? ''}
                          onChange={(event) =>
                            updateExercise(activeDay.id, exercise.id, {
                              notes: event.target.value || undefined,
                            })
                          }
                        />
                      )}
                    </Field>
                  </article>
                ))}
                {activeDay.exercises.length === 0 ? (
                  <p className="rounded-md border border-line bg-sunken p-4 text-sm text-ink-2">
                    No exercises yet. Add the first movement for this day.
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <Button onClick={() => setStage(existing ? 'setup' : 'schedule')}>
              {existing ? 'Edit setup' : 'Back'}
            </Button>
            <Button variant="primary" onClick={() => setStage('review')}>
              Review program
            </Button>
          </div>
        </div>
      ) : null}

      {stage === 'review' && draft ? (
        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-sunken p-3">
              <p className="text-xs text-ink-3">Schedule</p>
              <p className="numeric mt-1 font-semibold">{draft.days.length} days</p>
            </div>
            <div className="rounded-md bg-sunken p-3">
              <p className="text-xs text-ink-3">Exercises</p>
              <p className="numeric mt-1 font-semibold">{totalExercises}</p>
            </div>
            <div className="rounded-md bg-sunken p-3">
              <p className="text-xs text-ink-3">Duration</p>
              <p className="numeric mt-1 font-semibold">{draft.sessionMinutes} min</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {draft.days.map((day) => (
              <section key={day.id} className="rounded-md border border-line p-3">
                <h3 className="font-semibold">{day.name}</h3>
                {day.exercises.length > 0 ? (
                  <ol className="mt-2 space-y-1 text-sm text-ink-2">
                    {day.exercises.map((exercise) => (
                      <li key={exercise.id}>
                        {exercise.name}:{' '}
                        <span className="numeric">
                          {exercise.sets} × {exercise.repsMin}
                          {exercise.repsMax === exercise.repsMin ? '' : ` to ${exercise.repsMax}`}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-sm text-ink-3">No exercises added.</p>
                )}
              </section>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <Button onClick={() => setStage('edit')}>Edit exercises</Button>
            <Button variant="primary" disabled={busy} onClick={() => void save()}>
              {busy ? 'Saving' : 'Save program'}
            </Button>
          </div>
          {existing ? (
            <div className="mt-6 border-t border-line pt-5">
              {!confirmDelete ? (
                <Button variant="quiet" onClick={() => setConfirmDelete(true)}>
                  Delete program
                </Button>
              ) : (
                <Callout tone="error">
                  <p>Delete this program? This cannot be undone.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
                    <Button variant="danger" disabled={busy} onClick={() => void removePlan()}>
                      Yes, delete program
                    </Button>
                  </div>
                </Callout>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <ExercisePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addExercise}
      />
      <ExerciseDetailDialog exercise={details} onClose={() => setDetails(null)} />
    </Card>
  );
}
