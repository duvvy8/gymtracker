import { useEffect, useId, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
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
  size = 'default',
  className = '',
  retainOnClose = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'default' | 'wide';
  className?: string;
  /** Static reference content only; live forms/resources must follow props. */
  retainOnClose?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  const titleId = useId();
  const [lastContent, setLastContent] = useState({ title, description, children, footer });
  // Callers often clear their selection on close. Keep the last open content
  // intact while CSS finishes the native dialog's visual exit.
  useEffect(() => {
    if (open && retainOnClose) setLastContent({ title, description, children, footer });
  }, [open, retainOnClose, title, description, children, footer]);
  const content = !open && retainOnClose ? lastContent : { title, description, children, footer };

  openRef.current = open;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (open && !element.open) {
      element.inert = false;
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
      element.showModal();

      // showModal runs after React has already applied autoFocus, and its own
      // focusing steps land on the first tabbable element, which is the close
      // button. Placing focus afterwards is what actually sticks.
      element.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }

    if (!open && element.open) element.close();
    if (!open) element.inert = true;
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
  function handleNativeClose(event: SyntheticEvent<HTMLDialogElement>) {
    // React also delivers a nested image dialog's close event to its parent.
    // Closing that image must leave the machine/exercise details open.
    if (event.target !== event.currentTarget) return;
    if (event.currentTarget.open) return;
    event.currentTarget.inert = true;
    if (openRef.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      onClose={handleNativeClose}
      aria-labelledby={titleId}
      className={`${size === 'wide' ? 'max-w-5xl' : 'max-w-lg'} rounded-lg border border-line bg-surface text-ink shadow-raised ${className}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-semibold">
            {content.title}
          </h2>
          {content.description ? (
            <p className="mt-1 text-sm text-ink-3">{content.description}</p>
          ) : null}
        </div>
        <Button variant="quiet" size="icon" onClick={onClose} aria-label={`Close ${content.title}`}>
          <IconClose />
        </Button>
      </div>

      {/* Use the content's natural height as the flex basis. A zero basis can
          collapse this area in Safari when the dialog has only a max-height. */}
      <div ref={bodyRef} className="min-h-0 flex-auto overflow-y-auto px-4 py-4 sm:px-5">
        {content.children}
      </div>

      {content.footer ? (
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-line px-4 py-3 sm:px-5">
          {content.footer}
        </div>
      ) : null}
    </dialog>
  );
}
