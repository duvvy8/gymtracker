# gymtracker: project summary

## What this is

A calorie and macro tracker that runs entirely in the browser. No backend, no
accounts, no cloud sync. Everything is stored locally in IndexedDB via Dexie.

Live at https://gymtracker.kucera.uk, served from Cloudflare Workers Static
Assets. Source at https://github.com/duvvy8/gymtracker.

Stack: Vite, React 18, TypeScript (strict), react-router-dom, Dexie.js,
zustand, Tailwind CSS v4, recharts, zod. Barcode scanning through the camera,
with product lookup against the Open Food Facts API.

Five pages: Today, Log food, History, Settings, Privacy. Plus a real 404.

## What you asked for

### Scope

Calorie and macro tracking only. No workout logging, no exercise tracking, and
nothing built outside that scope.

### The build

A ten step build order, each step confirmed in the browser before starting the
next, committed with a clear message, and pushed once confirmed.

Two process requirements attached to it:

- Research before writing. The Open Food Facts integration had to be built
  against the current API documentation rather than from memory, confirming the
  v2 endpoint shape, headers, CORS behaviour and rate limits. Browsers forbid
  setting a custom User-Agent via fetch, so the documented alternative had to be
  used.
- Real device testing. The dev server had to be opened on the left monitor and
  kept there, with responsive testing done by actually resizing the browser
  window rather than only through device emulation.

### Security

Thirty numbered requirements. The main themes:

- No dangerouslySetInnerHTML, no eval, no dynamic script injection.
- Every API response validated with zod before use or storage. No unvalidated
  data spread into state or the database.
- Barcodes validated as digits of the correct length before any URL is built.
- All numeric input bounded and checked for NaN and Infinity. String fields
  length capped.
- JSON import parsed in a try/catch, validated whole, guarded against prototype
  pollution at any depth, and applied atomically.
- Outbound requests restricted to Open Food Facts only. No analytics, no
  telemetry, no runtime CDN loads.
- AbortController timeouts on every fetch. No raw error objects or response
  bodies rendered.
- Camera only on explicit user action, tracks stopped on unmount, permission
  denial handled with a manual entry fallback, no frame ever captured or sent.
- A strict CSP plus nosniff, no-referrer and a Permissions-Policy.
- Lockfile committed, dependencies pinned, npm audit clean, CI running
  typecheck, lint, build and audit.
- No secrets anywhere in the repository or its history.
- Honest documentation of the real limits: local data is unencrypted, lost if
  site data is cleared, single device only, and barcode numbers do leave the
  device.

### Design

An explicit design system defined first, and a ban list intended to stop the
result looking generated. No gradients, no emojis, no glassmorphism, no default
Inter, no pill buttons as default, no fake metrics or reviews, no em dashes
anywhere in the interface, comments or README, and no buzzword marketing copy.

Required instead: a real favicon, plain functional microcopy, full keyboard
navigability with visible focus states, and WCAG AA contrast.

### Deployment

Set up Cloudflare, then deploy to the custom subdomain gymtracker.kucera.uk.

### Production audit

A long brief covering product, UX, accessibility, frontend, SEO, performance,
mobile and reliability. The significant asks:

- No horizontal scroll at any width down to 320px, and not solved by hiding
  overflow.
- A mobile menu, a clickable logo, working buttons and links.
- A custom 404 that returns a real 404, rather than redirecting unknown routes
  to the home page.
- Unique page titles, meta descriptions, canonical tags, robots.txt, sitemap,
  llms.txt and structured data, with no fabricated business details or ratings.
- Alt text, semantic HTML, success and error messages, no placeholder text.
- No production source maps, no console errors, smaller bundles.
- Nothing invented. No fake email address, no fake phone number, no fake data.

Explicitly prohibited: AI features, analytics, advertising, tracking, session
replay, accounts, cloud sync, workout tracking, any weakening of security or
privacy, and any wholesale React rewrite without justification.

## Where it stands

The build and the deployment are complete and committed. The site is live.

The audit work is done but not yet committed, and covers roughly 42 files.
Verified so far: keyboard and focus behaviour passing in full, a responsive
sweep clean across every route from 320px to 1440px using deliberately hostile
data, a security re-audit passing all requirements with no vulnerabilities and
no secrets in history, and no em dashes anywhere in the repository.

Still to do: the remaining lower severity accessibility and UX fixes,
documentation updates, a final check and build, commit and push, redeploy, and
the closing QA report.
