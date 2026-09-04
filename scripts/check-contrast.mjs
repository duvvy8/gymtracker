/**
 * Verifies the palette in src/styles/tokens.css against WCAG 2.1 AA.
 * Token values are read from the stylesheet, so this cannot drift from
 * what the application actually renders.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TOKENS = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'styles', 'tokens.css');

const css = readFileSync(TOKENS, 'utf8');
const palette = new Map();
for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  palette.set(match[1], match[2]);
}

const srgb = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

function luminance(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * srgb((n >> 16) & 255) + 0.7152 * srgb((n >> 8) & 255) + 0.0722 * srgb(n & 255);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [foreground token, background token, minimum ratio, what it is used for] */
const CHECKS = [
  ['ink', 'paper', 4.5, 'body text on the app ground'],
  ['ink', 'surface', 4.5, 'body text on cards'],
  ['ink', 'sunken', 4.5, 'body text in wells'],
  ['ink-2', 'paper', 4.5, 'secondary text'],
  ['ink-2', 'surface', 4.5, 'secondary text on cards'],
  ['ink-3', 'paper', 4.5, 'muted labels'],
  ['ink-3', 'surface', 4.5, 'muted labels on cards'],
  ['ink-3', 'sunken', 4.5, 'muted labels in wells'],
  ['accent', 'paper', 4.5, 'link and active nav text'],
  ['accent', 'surface', 4.5, 'link text on cards'],
  ['accent', 'accent-weak', 4.5, 'text on the accent tint'],
  ['white', 'accent', 4.5, 'label on primary buttons'],
  ['white', 'danger', 4.5, 'label on destructive buttons'],
  ['danger', 'paper', 4.5, 'error text'],
  ['danger', 'surface', 4.5, 'error text on cards'],
  ['danger', 'danger-weak', 4.5, 'text on the error tint'],
  ['focus', 'paper', 3, 'focus ring against the ground'],
  ['focus', 'surface', 3, 'focus ring against cards'],
  ['line-input', 'paper', 3, 'form control boundary'],
  ['line-input', 'surface', 3, 'form control boundary on cards'],
  ['energy', 'paper', 4.5, 'calorie figures and chart marks'],
  ['protein', 'paper', 4.5, 'protein figures and chart marks'],
  ['carb', 'paper', 4.5, 'carbohydrate figures and chart marks'],
  ['fat', 'paper', 4.5, 'fat figures and chart marks'],
  ['weight', 'paper', 4.5, 'body weight figures and chart marks'],
  ['protein', 'surface', 4.5, 'protein figures on cards'],
  ['carb', 'surface', 4.5, 'carbohydrate figures on cards'],
  ['fat', 'surface', 4.5, 'fat figures on cards'],
  ['weight', 'surface', 4.5, 'body weight figures on cards'],
];

let failed = 0;
const rows = [];

for (const [fg, bg, min, usage] of CHECKS) {
  const fgHex = palette.get(fg);
  const bgHex = palette.get(bg);
  if (!fgHex || !bgHex) {
    console.error(`Missing token: --color-${fgHex ? bg : fg}`);
    failed += 1;
    continue;
  }
  const ratio = contrast(fgHex, bgHex);
  const ok = ratio >= min;
  if (!ok) failed += 1;
  rows.push(
    `${ok ? 'pass' : 'FAIL'}  ${ratio.toFixed(2).padStart(5)}:1  (min ${String(min).padStart(3)})  ` +
      `${fg} on ${bg}`.padEnd(30) +
      `  ${usage}`,
  );
}

console.log(rows.join('\n'));
console.log(
  `\n${CHECKS.length - failed}/${CHECKS.length} contrast checks passed against WCAG 2.1 AA.`,
);

if (failed > 0) {
  console.error(`\n${failed} contrast check(s) failed.`);
  process.exit(1);
}
