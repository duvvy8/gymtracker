import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * The only external origin this application is permitted to contact.
 * Product images are deliberately not loaded, so no image origin is allowlisted.
 */
const OPEN_FOOD_FACTS_ORIGIN = 'https://world.openfoodfacts.org';

/**
 * Production Content-Security-Policy.
 *
 * style-src-attr is the single relaxation. Recharts writes inline style
 * attributes onto the SVG nodes it renders, so blocking style attributes
 * outright breaks chart sizing and tooltips. 'unsafe-inline' scoped to
 * style-src-attr permits style attributes only. It does not permit
 * <style> elements, imported stylesheets, or CSSOM injection, all of
 * which remain restricted to 'self' by style-src.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "style-src-attr 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  `connect-src 'self' ${OPEN_FOOD_FACTS_ORIGIN}`,
  'upgrade-insecure-requests',
].join('; ');

/** Headers that are safe to apply in every mode, including the dev server. */
const BASE_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(self), geolocation=(), microphone=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
};

/** Full header set for anything serving the production bundle. */
const PRODUCTION_SECURITY_HEADERS: Record<string, string> = {
  ...BASE_SECURITY_HEADERS,
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
};

/**
 * Injects the CSP meta tag into the built index.html and emits host config
 * files, so the policy has exactly one source of truth in this repo.
 *
 * The dev server is excluded on purpose: Vite's HMR client needs inline
 * scripts and eval, which the production policy forbids.
 */
function securityAssets(): Plugin {
  return {
    name: 'gymtracker-security-assets',
    apply: 'build',
    transformIndexHtml(html: string) {
      const meta = `    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />\n`;
      return html.replace('</head>', `${meta}  </head>`);
    },
    generateBundle() {
      const headerLines = Object.entries(PRODUCTION_SECURITY_HEADERS)
        .map(([name, value]) => `  ${name}: ${value}`)
        .join('\n');

      this.emitFile({
        type: 'asset',
        fileName: '_headers',
        source: `/*\n${headerLines}\n`,
      });

      this.emitFile({
        type: 'asset',
        fileName: '_redirects',
        source: '/*  /index.html  200\n',
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), securityAssets()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    headers: BASE_SECURITY_HEADERS,
  },
  preview: {
    port: 4173,
    strictPort: true,
    headers: PRODUCTION_SECURITY_HEADERS,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    cssMinify: true,
    reportCompressedSize: false,
  },
});
