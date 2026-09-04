import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

/**
 * Selectors that make the project's hard security rules mechanically
 * enforceable rather than a matter of review discipline.
 */
const bannedSyntax = [
  {
    selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
    message: 'dangerouslySetInnerHTML is banned. Render text as children instead.',
  },
  {
    selector: 'Property[key.name="dangerouslySetInnerHTML"]',
    message: 'dangerouslySetInnerHTML is banned. Render text as children instead.',
  },
  {
    selector: 'MemberExpression[property.name="innerHTML"]',
    message: 'innerHTML is banned. Use textContent or React children.',
  },
  {
    selector: 'MemberExpression[property.name="outerHTML"]',
    message: 'outerHTML is banned.',
  },
  {
    selector: 'CallExpression[callee.property.name="insertAdjacentHTML"]',
    message: 'insertAdjacentHTML is banned.',
  },
  {
    selector: 'CallExpression[callee.object.name="document"][callee.property.name="write"]',
    message: 'document.write is banned.',
  },
  {
    selector: 'NewExpression[callee.name="Function"]',
    message: 'new Function is banned. It is equivalent to eval.',
  },
  {
    selector: 'CallExpression[callee.name="fetch"]',
    message: 'Call the vetted client in src/lib/http.ts instead of fetch directly.',
  },
];

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-restricted-syntax': ['error', ...bannedSyntax],
      'no-restricted-globals': [
        'error',
        { name: 'eval', message: 'eval is banned.' },
        { name: 'execScript', message: 'execScript is banned.' },
      ],

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // The vetted HTTP client is the one place fetch may be called.
    files: ['src/lib/http.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...bannedSyntax.slice(0, -1)],
    },
  },
  {
    // Build configuration is TypeScript but runs in Node, not the browser.
    files: ['vite.config.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
    },
  },
  {
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },
  prettier,
);
