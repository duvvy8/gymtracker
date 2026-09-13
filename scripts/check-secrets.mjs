// Enforces the goal's secret-leak rules automatically instead of by memory.
// Fails if anything that could reach the public GitHub repository carries key
// material, or if the ignore rules that keep the real secret private are lost.
//
// This script never prints a secret value. A finding reports the file and the
// kind of match only.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';

let checks = 0;

const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

// Built by concatenation so this file does not match its own patterns.
const KEY_PATTERNS = [
  { label: 'Google API key (AIza form)', re: new RegExp('AIza' + 'Sy[0-9A-Za-z_-]{20,}') },
  { label: 'Google API key (AQ form)', re: new RegExp('AQ' + '\\.[A-Za-z0-9_-]{24,}') },
  { label: 'inline VITE Gemini key', re: /VITE_GEMINI[0-9A-Z_]*\s*[:=]/ },
];

const PLACEHOLDERS = ['YOUR_KEY_HERE', 'PASTE_YOUR_GEMINI_API_KEY_HERE', 'test-only'];

// 1. The real secret file must never be tracked or present in history.
assert.equal(
  git(['ls-files']).includes('.dev.vars'),
  false,
  '.dev.vars is tracked by Git. It must never be committed.',
);
checks++;

assert.equal(
  git(['log', '--all', '--oneline', '--', '.dev.vars']).length,
  0,
  '.dev.vars appears in Git history. The key must be rotated.',
);
checks++;

// 2. The ignore rules that keep it private must still exist.
const ignoreRules = readFileSync('.gitignore', 'utf8')
  .split('\n')
  .map((line) => line.trim());
for (const rule of ['.dev.vars', '.env', 'dist/', '.wrangler/']) {
  assert.ok(ignoreRules.includes(rule), `.gitignore no longer ignores ${rule}.`);
}
checks++;

// 3. The tracked example must only ever hold a placeholder.
if (existsSync('.dev.vars.example')) {
  const example = readFileSync('.dev.vars.example', 'utf8');
  const value = /GEMINI_API_KEY\s*=\s*"?([^"\n\r]*)"?/.exec(example)?.[1] ?? '';
  assert.ok(
    PLACEHOLDERS.includes(value),
    '.dev.vars.example contains something other than a placeholder.',
  );
  checks++;
}

// 4. Nothing publishable may contain key material. Tracked files plus untracked
//    files that are not ignored are exactly what a commit could expose.
const publishable = [...git(['ls-files']), ...git(['ls-files', '--others', '--exclude-standard'])];

const findings = [];
for (const file of publishable) {
  if (!existsSync(file)) continue;
  if (statSync(file).size > 8 * 1024 * 1024) continue;
  let buffer;
  try {
    buffer = readFileSync(file);
  } catch {
    continue;
  }
  if (buffer.includes(0)) continue; // binary file
  const contents = buffer.toString('utf8');
  for (const { label, re } of KEY_PATTERNS) {
    if (re.test(contents)) findings.push(`${file}: ${label}`);
  }
  const assigned = /GEMINI_API_KEY\s*=\s*"([^"\n\r]+)"/.exec(contents)?.[1];
  if (assigned && !PLACEHOLDERS.includes(assigned)) {
    findings.push(`${file}: GEMINI_API_KEY assigned a literal value`);
  }
}
assert.deepEqual(findings, [], `Key material found in publishable files:\n${findings.join('\n')}`);
checks++;

console.log(
  `${checks} secret-hygiene checks passed: no key material in tracked or untracked files, and the ignore rules are intact.`,
);
