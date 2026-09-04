/**
 * Button appearance, kept out of the component file so that module can
 * export components only and stay eligible for fast refresh.
 *
 * Corners are 5px throughout. Buttons are rectangles with softened corners,
 * never pills. Hover changes background and border colour; it never fades
 * opacity, which reads as the control becoming disabled.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'md' | 'sm' | 'icon';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md border font-medium ' +
  'transition-colors disabled:cursor-not-allowed disabled:border-line ' +
  'disabled:bg-sunken disabled:text-ink-3';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover',
  secondary: 'border-line-input bg-surface text-ink hover:bg-sunken',
  quiet: 'border-transparent bg-transparent text-ink-2 hover:bg-sunken hover:text-ink',
  danger: 'border-danger bg-danger text-white hover:border-ink hover:bg-ink',
};

/** Sizes clear the 44px comfortable touch target except the compact variant. */
const SIZES: Record<ButtonSize, string> = {
  md: 'h-11 px-4 text-sm',
  sm: 'h-9 px-3 text-sm',
  icon: 'h-11 w-11 shrink-0',
};

export function buttonClasses(
  variant: ButtonVariant = 'secondary',
  size: ButtonSize = 'md',
  className = '',
): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}
