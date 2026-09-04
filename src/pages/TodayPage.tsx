import { Card, EmptyState, PageHeader } from '../components/ui';

export function TodayPage() {
  return (
    <>
      <PageHeader title="Today" description="This section is not built yet." />
      <Card>
        <EmptyState title="Nothing here yet">
          The Today screen is scaffolded. Content arrives in a later build step.
        </EmptyState>
      </Card>
    </>
  );
}
