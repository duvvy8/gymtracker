/**
 * Fails if a component reaches around the design system.
 *
 * Two rules:
 *   1. No arbitrary length values in class names (for example p-[13px]).
 *      Spacing and sizing must come from the scale in tokens.css.
 *   2. No raw colour literals in .tsx files. Colours must be referenced
 *      through Tailwind utilities or the CSS custom properties.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

const ARBITRARY_LENGTH = /\[[0-9]+(?:\.[0-9]+)?(?:px|rem|em|vh|vw|ch|%)\]/g;
const HEX_COLOUR = /#[0-9a-fA-F]{3,8}\b/g;

/** Files allowed to name a colour directly, with the reason. */
const COLOUR_LITERAL_ALLOWLIST = new Set([
  // Recharts takes fill and stroke as props, not class names. These read the
  // computed value of a design token at runtime rather than hard-coding one.
  'src/lib/chartTheme.ts',
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|css)$/.test(entry)) out.push(full);
  }
  return out;
}

let failures = 0;

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const source = readFileSync(file, 'utf8');

  for (const [index, line] of source.split('\n').entries()) {
    for (const match of line.matchAll(ARBITRARY_LENGTH)) {
      console.error(
        `${rel}:${index + 1}  arbitrary length ${match[0]}. Use a step from the spacing scale.`,
      );
      failures += 1;
    }

    // tokens.css is where colours are allowed to be defined.
    if (rel.endsWith('styles/tokens.css') || COLOUR_LITERAL_ALLOWLIST.has(rel)) continue;
    for (const match of line.matchAll(HEX_COLOUR)) {
      console.error(`${rel}:${index + 1}  colour literal ${match[0]}. Use a design token.`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} design system violation(s).`);
  process.exit(1);
}
console.log('Design system check passed: no arbitrary lengths, no colour literals.');
