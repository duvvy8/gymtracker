import { Card, LinkButton, PageHeader } from '../components/ui';
import { ROUTES } from '../lib/routeMeta';

/**
 * A real not-found screen.
 *
 * The previous wildcard route redirected every unknown path to Today, which
 * quietly pretended the visitor had asked for the home page. This says what
 * happened and offers the three places worth going next.
 *
 * The host returns a genuine 404 status for these paths: the build emits a
 * file for every known route, so anything left over is answered by 404.html
 * rather than by an SPA fallback with a 200.
 */
export function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="Page not found"
        description="That address does not match any page in gymtracker. It may have been mistyped, or it may be a link to something that never existed here."
      />

      <Card className="p-4 sm:p-5">
        <h2 className="text-base font-semibold text-ink">Where to go instead</h2>
        <p className="mt-1 max-w-(--container-measure) text-sm text-ink-2">
          Your food log is untouched. It is stored in this browser and nothing about this page
          affects it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <LinkButton to={ROUTES.today.path} variant="primary">
            Go to Today
          </LinkButton>
          <LinkButton to={ROUTES.log.path}>Log food</LinkButton>
          <LinkButton to={ROUTES.history.path}>History</LinkButton>
        </div>
      </Card>
    </>
  );
}
