import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  ALL_ROUTES,
  INDEXABLE_ROUTES,
  ROUTES,
  SITE_ORIGIN,
  canonicalFor,
} from './src/lib/routeMeta.ts';

/**
 * The only external origin this application is permitted to contact.
 * Product images are deliberately not loaded, so no image origin is allowlisted.
 */
const OPEN_FOOD_FACTS_ORIGIN = 'https://world.openfoodfacts.org';

const SOCIAL_IMAGE = '/social-card.png';
const SOCIAL_IMAGE_WIDTH = 1200;
const SOCIAL_IMAGE_HEIGHT = 630;

/**
 * Content-Security-Policy directives shared by the response header and the
 * meta fallback.
 *
 * style-src-attr is the single relaxation. Recharts writes inline style
 * attributes onto the SVG nodes it renders, so blocking style attributes
 * outright breaks chart sizing and tooltips. 'unsafe-inline' scoped to
 * style-src-attr permits style attributes only. It does not permit <style>
 * elements, imported stylesheets, or CSSOM injection, all of which remain
 * restricted to 'self' by style-src.
 */
const CSP_SHARED = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
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
];

/** The real policy. frame-ancestors is only meaningful in a response header. */
const CONTENT_SECURITY_POLICY = [...CSP_SHARED, "frame-ancestors 'none'"].join('; ');

/**
 * The meta fallback, for a host that cannot set response headers. It omits
 * frame-ancestors deliberately: browsers ignore that directive when it
 * arrives in a meta element and log a console error about it. Clickjacking
 * protection comes from the real header plus X-Frame-Options, so dropping
 * the copy that never worked removes console noise without weakening
 * anything.
 */
const CONTENT_SECURITY_POLICY_META = CSP_SHARED.join('; ');

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

const START_MARKER = '<!--ROUTE_META_START-->';
const END_MARKER = '<!--ROUTE_META_END-->';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Structured data, on the front door only.
 *
 * WebApplication has no required properties and describes exactly what this
 * is. `offers` is present at price 0 because the app genuinely is free.
 * There is deliberately no aggregateRating or review, because none exist and
 * inventing them would violate Google's structured data policies. There is
 * no Organization, because there is no organization, and no LocalBusiness,
 * because that type requires a postal address and this product has no
 * premises to describe.
 */
function structuredData(): string {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: 'gymtracker',
        url: `${SITE_ORIGIN}/`,
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_ORIGIN}/#app`,
        name: 'gymtracker',
        url: `${SITE_ORIGIN}/`,
        description: ROUTES.today.description,
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript and IndexedDB support.',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: 0, priceCurrency: 'GBP' },
        featureList: [
          'Calorie and macronutrient tracking',
          'Barcode scanning with Open Food Facts lookup',
          'Body weight tracking',
          'Local workout program creation and editing',
          'Gym machine catalogue with exercise guidance',
          'Local-first storage in the browser, with no account',
          'Export and import of all data as JSON',
        ],
      },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(graph)}</script>`;
}

/** The head fragment that replaces the placeholder for one route. */
function headFor(path: string): string {
  const route = ALL_ROUTES.find((entry) => entry.path === path) ?? ROUTES.notFound;
  const isRealRoute = path !== '*';
  const robots = route.indexable ? 'index, follow' : 'noindex, follow';
  const image = SITE_ORIGIN + SOCIAL_IMAGE;

  const lines = [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    // The 404 page is served for every unknown path, so there is no one URL it
    // is the canonical version of. A canonical pointing at /404 would only
    // invite a crawler to index a page that does not exist.
    ...(isRealRoute ? [`<link rel="canonical" href="${canonicalFor(path)}" />`] : []),
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="gymtracker" />',
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    ...(isRealRoute ? [`<meta property="og:url" content="${canonicalFor(path)}" />`] : []),
    '<meta property="og:locale" content="en_GB" />',
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="${SOCIAL_IMAGE_WIDTH}" />`,
    `<meta property="og:image:height" content="${SOCIAL_IMAGE_HEIGHT}" />`,
    '<meta property="og:image:alt" content="gymtracker: nutrition tracking, workout programs and gym machines, stored in your browser." />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY_META}" />`,
  ];

  // Site-level structured data belongs on the home page only.
  if (path === '/') lines.push(structuredData());

  return lines.map((line) => '    ' + line).join('\n');
}

function swapHead(html: string, path: string): string {
  const start = html.indexOf(START_MARKER);
  const end = html.indexOf(END_MARKER);
  if (start === -1 || end === -1) {
    throw new Error('index.html is missing the ROUTE_META placeholder markers.');
  }
  return (
    html.slice(0, start) +
    START_MARKER +
    '\n' +
    headFor(path) +
    '\n    ' +
    END_MARKER +
    html.slice(end + END_MARKER.length)
  );
}

/**
 * Emits one static HTML file per route, plus a real 404 page, robots.txt,
 * sitemap.xml and the host header config.
 *
 * Cloudflare Workers static assets answers a request from a matching file
 * before it consults not_found_handling, so /log is served by /log/index.html
 * with its own head. That gives every route correct metadata for crawlers
 * that never execute JavaScript, and lets genuinely unmatched paths return a
 * real 404 status instead of the 200 an SPA fallback produces.
 */
function siteAssets(): Plugin {
  let outDir = 'dist';

  const write = (relativePath: string, contents: string) => {
    const target = join(outDir, relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  };

  return {
    name: 'gymtracker-site-assets',
    apply: 'build',

    configResolved(config) {
      outDir = config.build.outDir;
    },

    transformIndexHtml(html) {
      return swapHead(html, '/');
    },

    // writeBundle rather than generateBundle: under Vite 8 the HTML asset is
    // not yet in the bundle map when this plugin's generateBundle runs, so
    // the finished file is read back from disk instead.
    writeBundle() {
      const homeHtml = readFileSync(join(outDir, 'index.html'), 'utf8');

      for (const route of ALL_ROUTES) {
        if (route.path === '/') continue;
        write(route.path.slice(1) + '/index.html', swapHead(homeHtml, route.path));
      }

      write('404.html', swapHead(homeHtml, '*'));

      const headerLines = Object.entries(PRODUCTION_SECURITY_HEADERS)
        .map(([name, value]) => '  ' + name + ': ' + value)
        .join('\n');
      write(
        '_headers',
        [
          '/*',
          headerLines,
          '',
          // Everything under /assets carries a content hash in its filename, so
          // a given URL can never change. immutable stops browsers spending a
          // revalidation round trip on files that are replaced rather than
          // edited. The HTML deliberately keeps the default short cache so a
          // deploy is picked up straight away.
          '/assets/*',
          '  Cache-Control: public, max-age=31536000, immutable',
          '',
        ].join('\n'),
      );

      // Crawling is left open on purpose. Disallowing the app routes would
      // stop a crawler ever reading their noindex tag, which is the only
      // thing that actually keeps them out of the index.
      write(
        'robots.txt',
        ['User-agent: *', 'Allow: /', '', 'Sitemap: ' + SITE_ORIGIN + '/sitemap.xml', ''].join(
          '\n',
        ),
      );

      // Only the routes genuinely worth indexing. changefreq and priority are
      // omitted because Google documents that it ignores both.
      const urls = INDEXABLE_ROUTES.map(
        (route) => '  <url><loc>' + canonicalFor(route.path) + '</loc></url>',
      ).join('\n');
      write(
        'sitemap.xml',
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          urls,
          '</urlset>',
          '',
        ].join('\n'),
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteAssets()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, strictPort: true, headers: BASE_SECURITY_HEADERS },
  preview: { port: 4173, strictPort: true, headers: PRODUCTION_SECURITY_HEADERS },
  build: {
    target: 'es2022',
    sourcemap: false,
    cssMinify: true,
    reportCompressedSize: false,
  },
});
