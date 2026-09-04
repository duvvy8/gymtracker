import { Card, EmptyState, PageHeader } from '../components/ui';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="This section is not built yet." />
      <Card>
        <EmptyState title="Nothing here yet">
          The Settings screen is scaffolded. Content arrives in a later build step.
        </EmptyState>
      </Card>
    </>
  );
}
