import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { ALL_ROUTES } from '../lib/routeMeta';
import { IconClose } from './icons';
import { Button } from './ui';

/**
 * The complete navigation map on narrow screens.
 *
 * The bottom tab bar carries the five destinations people reach for daily.
 * This drawer carries everything, including Privacy, plus the context that
 * does not belong on a tab.
 *
 * It is a native <dialog> opened with showModal(), which is what supplies
 * focus containment, Escape to close, inertness of the page behind, and
 * restoring focus to the trigger on close. A hand-rolled focus trap would be
 * more code and would disagree with the browser in edge cases.
 */
export function MobileMenu({
  open,
  onClose,
  id,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      element.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      id={id}
      onClose={onClose}
      aria-labelledby={`${id}-title`}
      className="drawer border-l border-line bg-surface text-ink shadow-raised"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 id={`${id}-title`} className="text-base font-semibold">
          Menu
        </h2>
        <Button
          variant="quiet"
          size="icon"
          onClick={onClose}
          aria-label="Close menu"
          data-autofocus
        >
          <IconClose />
        </Button>
      </div>

      <nav aria-label="All sections" className="min-h-0 flex-1 overflow-y-auto py-2">
        {ALL_ROUTES.map(({ path, navLabel }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center border-l-2 px-4 py-3 text-base font-medium transition-colors',
                isActive
                  ? 'border-accent bg-accent-weak text-accent'
                  : 'border-transparent text-ink-2 hover:bg-sunken hover:text-ink',
              ].join(' ')
            }
          >
            {navLabel}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line px-4 py-4">
        <p className="text-sm text-ink-3">
          Your food log and workout programs stay in this browser. Barcode lookups use Open Food
          Facts.
        </p>
      </div>
    </dialog>
  );
}
