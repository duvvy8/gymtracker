import { useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { IconClose } from './icons';
import { Button } from './ui';

/**
 * Confirmation messages after an action.
 *
 * The live region is mounted permanently and only its text changes.
 * A region that appears at the same moment as its content is unreliable in
 * screen readers, because there is nothing there to observe the change on.
 * The visible card is therefore marked aria-hidden to avoid a double read.
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
      <div role="status" aria-live="polite" className="sr-only">
        {notice?.message ?? ''}
      </div>

      {notice ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 above-tab-bar lg:bottom-6 lg:justify-end lg:pr-8"
        >
          <div
            className={`pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-md border py-2 pl-4 pr-2 shadow-raised ${
              notice.tone === 'error'
                ? 'border-danger bg-danger-weak'
                : 'border-line-strong bg-surface'
            }`}
          >
            <p className="min-w-0 flex-1 py-1.5 text-sm text-ink">{notice.message}</p>
            <Button variant="quiet" size="icon" onClick={dismissNotice} aria-label="Dismiss">
              <IconClose />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
