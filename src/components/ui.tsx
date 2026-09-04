import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { IconAlert } from './icons';

/* -------------------------------------------------------------------------
 * Buttons
 *
 * Rectangles with a 5px radius. Never pills. Hover changes background and
 * border colour only, never opacity.
 * ---------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
type ButtonSize = 'md' | 'sm' | 'icon';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md border font-medium ' +
  'transition-colors disabled:cursor-not-allowed disabled:border-line ' +
  'disabled:bg-sunken disabled:text-ink-3';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover',
  secondary: 'border-line-input bg-surface text-ink hover:bg-sunken',
  quiet: 'border-transparent bg-transparent text-ink-2 hover:bg-sunken hover:text-ink',
  danger: 'border-danger bg-danger text-white hover:border-ink hover:bg-ink',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: 'h-11 px-4 text-sm',
  sm: 'h-9 px-3 text-sm',
  icon: 'h-11 w-11 shrink-0',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className = '', type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...rest}
    />
  );
});

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
  return (
    <Tag className={`rounded-lg border border-line bg-surface shadow-card ${className}`}>
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

export function Callout({
  tone = 'neutral',
  title,
  children,
  live = 'polite',
}: {
  tone?: 'neutral' | 'error';
  title?: string;
  children: ReactNode;
  live?: 'polite' | 'assertive' | 'off';
}) {
  const toneClass =
    tone === 'error' ? 'border-danger bg-danger-weak text-ink' : 'border-line bg-sunken text-ink';

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={live}
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
