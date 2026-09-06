import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { Link } from 'react-router-dom';
import { IconAlert } from './icons';
import { buttonClasses, type ButtonSize, type ButtonVariant } from '../lib/buttonStyles';

/* -------------------------------------------------------------------------
 * Buttons
 * ---------------------------------------------------------------------- */

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className = '', type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...rest} />
  );
});

/** A router link that reads as a button. Kept a real anchor for the a11y tree. */
export function LinkButton({
  to,
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
}: {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={buttonClasses(variant, size, className)}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------
 * Surfaces
 * ---------------------------------------------------------------------- */

export function Card({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
}) {
  // min-w-0 is load bearing. A card is usually a grid or flex item, and those
  // default to min-width: auto, which refuses to shrink below the content's
  // intrinsic width. A chart inside would then hold the card open at its last
  // measured size and push a horizontal scrollbar onto the page.
  return (
    <Tag className={`min-w-0 rounded-lg border border-line bg-surface shadow-card ${className}`}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink-3">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-(--container-measure) text-ink-2">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Form controls
 * ---------------------------------------------------------------------- */

const CONTROL_BASE =
  'w-full rounded-md border border-line-input bg-surface px-3 text-base text-ink ' +
  'placeholder:text-ink-3 disabled:bg-sunken disabled:text-ink-3';

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className = '',
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  const generated = useId();
  const id = htmlFor ?? generated;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-xs text-danger">
          <IconAlert width="14" height="14" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', ...rest }, ref) {
    return <input ref={ref} className={`${CONTROL_BASE} h-11 ${className}`} {...rest} />;
  },
);

/**
 * Numeric entry uses type="text" with a decimal input mode. It shows the
 * numeric keypad on touch devices without inheriting type="number"'s
 * scroll-to-change behaviour or its locale-dependent parsing.
 */
export const NumberInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function NumberInput({ className = '', ...rest }, ref) {
    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        className={`${CONTROL_BASE} numeric h-11 ${className}`}
        {...rest}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...rest }, ref) {
    return (
      <select ref={ref} className={`${CONTROL_BASE} h-11 pr-8 ${className}`} {...rest}>
        {children}
      </select>
    );
  },
);

/* -------------------------------------------------------------------------
 * Feedback
 * ---------------------------------------------------------------------- */

/**
 * An inline message.
 *
 * `role` carries the politeness on its own: role="alert" is assertive and
 * role="status" is polite. An explicit aria-live was previously set alongside
 * it and silently demoted every error to polite, which is the opposite of
 * what role="alert" was chosen for.
 *
 * `announce` exists for messages that are permanently on screen rather than
 * appearing in response to an action. A static explanatory note in a live
 * region re-announces itself whenever its text is recomputed, so those pass
 * announce={false} and become ordinary text.
 */
export function Callout({
  tone = 'neutral',
  title,
  children,
  announce = true,
}: {
  tone?: 'neutral' | 'error';
  title?: string;
  children: ReactNode;
  announce?: boolean;
}) {
  const toneClass =
    tone === 'error' ? 'border-danger bg-danger-weak text-ink' : 'border-line bg-sunken text-ink';

  return (
    <div
      role={announce ? (tone === 'error' ? 'alert' : 'status') : undefined}
      className={`rounded-md border px-4 py-3 text-sm ${toneClass}`}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="text-ink-2">{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="px-4 py-10 text-center sm:px-6">
      <p className="text-base font-medium text-ink">{title}</p>
      {children ? (
        <div className="mx-auto mt-2 max-w-(--container-measure) text-sm text-ink-3">
          {children}
        </div>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
