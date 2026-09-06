import { useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { IconClose } from './icons';
import { Button } from './ui';

/**
 * Confirmation messages after an action.
 *
 * The live region is mounted permanently and only its text changes. A region
 * that appears at the same moment as its content is unreliable in screen
 * readers, because there is nothing there to observe the change on.
 *
 * The visible card's *text* is therefore hidden from assistive technology to
 * avoid announcing the same message twice. The dismiss button is deliberately
 * outside that hidden subtree: a focusable control inside aria-hidden is a
 * keyboard trap for anyone who can tab to a button their screen reader
 * insists does not exist.
 */
export function NoticeBar() {
  const notice = useAppStore((state) => state.notice);
  const dismissNotice = useAppStore((state) => state.dismissNotice);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(dismissNotice, 6000);
    return () => window.clearTimeout(timer);
  }, [notice, dismissNotice]);

  return (
    <>
      <div role="status" className="sr-only">
        {notice?.message ?? ''}
      </div>

      {notice ? (
        <div className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 above-tab-bar lg:bottom-6 lg:justify-end lg:pr-8">
          <div
            className={`pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-md border py-2 pl-4 pr-2 shadow-raised ${
              notice.tone === 'error'
                ? 'border-danger bg-danger-weak'
                : 'border-line-strong bg-surface'
            }`}
          >
            <p aria-hidden="true" className="min-w-0 flex-1 py-1.5 text-sm text-ink">
              {notice.message}
            </p>
            <Button
              variant="quiet"
              size="icon"
              onClick={dismissNotice}
              aria-label="Dismiss message"
            >
              <IconClose />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
