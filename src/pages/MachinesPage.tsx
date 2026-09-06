import { useState } from 'react';
import { MACHINE_REGIONS, machinesForRegion } from '../data/machines';
import { exercisesForMachine } from '../data/exercises';
import type { GymMachine } from '../types';
import { MachineImagePanel } from '../components/MachineImagePanel';
import { MuscleEmphasisBars } from '../components/MuscleEmphasisBars';
import { Button, Card, PageHeader } from '../components/ui';
import { Dialog } from '../components/Dialog';

export function MachinesPage() {
  const [selected, setSelected] = useState<GymMachine | null>(null);

  return (
    <>
      <PageHeader
        title="Machines"
        description="The equipment confirmed at your gym, grouped by the area it mainly trains."
      />

      <div className="grid gap-8">
        {MACHINE_REGIONS.map((region) => {
          const machines = machinesForRegion(region);
          return (
            <section key={region} aria-labelledby={`machines-${region.toLowerCase()}`}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 id={`machines-${region.toLowerCase()}`} className="text-xl font-semibold">
                  {region}
                </h2>
                <span className="numeric text-xs text-ink-3">
                  {machines.length} {machines.length === 1 ? 'machine' : 'machines'}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {machines.map((machine) => (
                  <Card key={machine.id} as="article" className="flex flex-col p-4">
                    <MachineImagePanel machine={machine} />
                    <div className="flex flex-1 flex-col pt-4">
                      <h3 className="text-lg font-semibold">{machine.displayName}</h3>
                      <p className="mt-1 text-xs text-ink-3">Approximate muscle emphasis</p>
                      <div className="mt-3">
                        <MuscleEmphasisBars items={machine.emphasis.slice(0, 3)} />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button onClick={() => setSelected(machine)}>View machine</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.displayName ?? 'Machine'}
        description={selected ? `${selected.region} equipment` : undefined}
        size="wide"
        footer={<Button onClick={() => setSelected(null)}>Close</Button>}
      >
        {selected ? (
          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            <MachineImagePanel machine={selected} detail />
            <section>
              <h3 className="text-base font-semibold">Muscle emphasis</h3>
              <p className="mt-1 text-sm text-ink-3">
                Rounded planning estimates, not biomechanical measurements.
              </p>
              <div className="mt-4">
                <MuscleEmphasisBars items={selected.emphasis} />
              </div>
              <h3 className="mt-6 text-base font-semibold">Exercises</h3>
              <ul className="mt-2 space-y-2 text-sm text-ink-2">
                {exercisesForMachine(selected.id).map((exercise) => (
                  <li
                    key={exercise.id}
                    className="border-t border-line pt-2 first:border-t-0 first:pt-0"
                  >
                    {exercise.name}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
