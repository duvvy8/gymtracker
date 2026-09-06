import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconClose } from './icons';
import { Button } from './ui';

/**
 * Modal built on the native dialog element.
 *
 * showModal() gives focus containment, Escape to close, inertness of the
 * page behind, the top layer, and restoring focus to whatever was focused
 * before, all without a JavaScript focus trap that could disagree with the
 * browser's own.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);
  const titleId = useId();

  openRef.current = open;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (open && !element.open) {
      element.showModal();

      // showModal runs after React has already applied autoFocus, and its own
      // focusing steps land on the first tabbable element, which is the close
      // button. Placing focus afterwards is what actually sticks.
      element.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }

    if (!open && element.open) element.close();
  }, [open]);

  /**
   * Only the `close` event is wired, not `cancel`. Escape fires `cancel`, and
   * its default action closes the dialog, which fires `close` in turn, so
   * listening to both would call the parent twice per keypress.
   *
   * The guard covers the other direction: closing programmatically (the
   * effect above, after the parent already set open to false) also fires
   * `close`, and the parent does not need telling about a close it initiated.
   */
  function handleNativeClose() {
    if (openRef.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      onClose={handleNativeClose}
      aria-labelledby={titleId}
      className="max-w-lg rounded-lg border border-line bg-surface text-ink shadow-raised"
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {description ? <p className="mt-1 text-sm text-ink-3">{description}</p> : null}
        </div>
        <Button variant="quiet" size="icon" onClick={onClose} aria-label={`Close ${title}`}>
          <IconClose />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

      {footer ? (
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-line px-4 py-3 sm:px-5">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
