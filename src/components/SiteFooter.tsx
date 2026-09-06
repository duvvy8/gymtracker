import { Link } from 'react-router-dom';
import { ROUTES } from '../lib/routeMeta';

const SOURCE_URL = 'https://github.com/duvvy8/gymtracker';

/**
 * The site footer, and the app's only `contentinfo` landmark.
 *
 * It is deliberately short. There is no company, no postal address, no
 * telephone number and no contact mailbox behind this project, so none are
 * invented here: a fabricated mailto: or tel: link would be worse than no
 * link at all.
 *
 * The year is read at render time rather than hard-coded, so it cannot go
 * stale. The app is client-rendered, so there is no server/client mismatch
 * to worry about.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-(--container-wide) px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-2">
            Your food log and workout programs stay in this browser. Barcode lookups use Open Food
            Facts.
          </p>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to={ROUTES.privacy.path}
              className="text-sm font-medium text-accent underline underline-offset-2"
            >
              Privacy
            </Link>
            <a
              href={SOURCE_URL}
              rel="noreferrer noopener"
              className="text-sm font-medium text-accent underline underline-offset-2"
            >
              Source code
            </a>
            <p className="numeric text-sm text-ink-3">
              <span aria-hidden="true">&copy; </span>
              <span className="sr-only">Copyright </span>
              {new Date().getFullYear()} gymtracker
            </p>
          </nav>
        </div>
      </div>
    </footer>
  );
}
