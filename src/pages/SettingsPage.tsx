import { useLiveQuery } from 'dexie-react-hooks';
import {
  countBodyWeights,
  countFoodLogs,
  countFoods,
  countWorkoutPlans,
  getSettings,
} from '../db/queries';
import { useAppStore } from '../lib/store';
import { BodyWeightPanel } from '../components/BodyWeightPanel';
import { DataPanel } from '../components/DataPanel';
import { TargetsForm } from '../components/TargetsForm';
import { Card, CardHeader, PageHeader } from '../components/ui';

export function SettingsPage() {
  const showNotice = useAppStore((state) => state.showNotice);

  const settings = useLiveQuery(() => getSettings(), []);
  const counts = useLiveQuery(
    async () => ({
      foods: await countFoods(),
      foodLogs: await countFoodLogs(),
      bodyWeights: await countBodyWeights(),
      workoutPlans: await countWorkoutPlans(),
    }),
    [],
  );

  return (
    <>
      <PageHeader
        title="Settings"
        description="Targets, body weight, and what happens to your data."
      />

      <div className="grid gap-5">
        <Card>
          <CardHeader title="Daily targets" description="What the Today page measures against" />
          {settings ? (
            <TargetsForm settings={settings} onSaved={(message) => showNotice(message)} />
          ) : (
            <p className="p-4 text-sm text-ink-3 sm:p-5">Loading your targets.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Body weight" description="One reading per day" />
          <BodyWeightPanel
            unit={settings?.weightUnit ?? 'kg'}
            onSaved={(message) => showNotice(message)}
          />
        </Card>

        <Card>
          <CardHeader
            title="Your data"
            description="Everything is stored in this browser and nowhere else"
          />
          {counts ? (
            <DataPanel counts={counts} onNotice={(message, tone) => showNotice(message, tone)} />
          ) : (
            <p role="status" className="p-4 text-sm text-ink-3">
              Loading your stored data.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
