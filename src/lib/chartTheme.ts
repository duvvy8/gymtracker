/**
 * Design tokens for Recharts.
 *
 * Recharts takes colours as props, not class names, so this is the one
 * module that needs token values as strings. It reads them from the CSS
 * custom properties the design system already emits, which keeps
 * tokens.css the single source of truth at runtime.
 *
 * The fallbacks below exist only for the moment before styles are applied.
 * `npm run check:tokens` asserts that every one of them matches the value
 * in tokens.css, so the two cannot drift apart.
 */

const TOKEN_FALLBACKS: Record<string, string> = {
  'color-energy': '#2b2a22',
  'color-protein': '#1f5e4e',
  'color-carb': '#9a5b00',
  'color-fat': '#9b3b32',
  'color-weight': '#35566e',
  'color-line': '#dcd6c9',
  'color-line-strong': '#c6bfae',
  'color-ink': '#16150f',
  'color-ink-2': '#4a4639',
  'color-ink-3': '#6b6555',
  'color-surface': '#ffffff',
  'color-sunken': '#ebe7de',
  'color-danger': '#a32b22',
};

let cache: Record<string, string> | null = null;

function readTokens(): Record<string, string> {
  if (cache) return cache;

  const resolved: Record<string, string> = {};
  const computed =
    typeof document === 'undefined' ? null : getComputedStyle(document.documentElement);

  for (const [name, fallback] of Object.entries(TOKEN_FALLBACKS)) {
    const value = computed?.getPropertyValue(`--${name}`).trim();
    resolved[name] = value || fallback;
  }

  cache = resolved;
  return resolved;
}

export function token(name: keyof typeof TOKEN_FALLBACKS & string): string {
  return readTokens()[name] ?? TOKEN_FALLBACKS[name] ?? '';
}

/** Shared axis and grid styling, so all three charts read as one family. */
export const chartAxis = {
  tick: { fill: token('color-ink-3'), fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: token('color-line') },
} as const;

export const chartGrid = {
  stroke: token('color-line'),
  strokeDasharray: '2 4',
  vertical: false,
} as const;

export const chartTooltip = {
  contentStyle: {
    backgroundColor: token('color-surface'),
    border: `1px solid ${token('color-line-strong')}`,
    borderRadius: '5px',
    fontSize: '13px',
    color: token('color-ink'),
    boxShadow: '0 1px 0 rgb(22 21 15 / 0.05), 0 4px 14px rgb(22 21 15 / 0.11)',
  },
  labelStyle: { color: token('color-ink-3'), marginBottom: '4px' },
  cursor: { fill: token('color-sunken') },
} as const;
