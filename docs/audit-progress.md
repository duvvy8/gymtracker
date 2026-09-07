# Production improvement audit: current evidence

This is a working record, not a completion certificate. Existing staged work is
preserved. The combined audit has not been deployed by this Codex session.

## Verified in Chrome on 6 September 2026

The user's existing left-screen Chrome tab was used. Screenshots were captured
and visually inspected in the conversation at each major tour stage.

- Production Today, Log food, manual food form, validation errors, scanner entry,
  History, Settings and Privacy were inspected.
- Production still uses the old plain-text logo, common page title and unknown-route
  redirect. Those observations must not be confused with local implementation.
- Local Today now has one first-use logging action and explicit remaining macro grams.
- Local unknown route preserves its URL and renders the custom 404 with recovery links.
- Local Settings rejected Infinity, but its macro preview initially displayed Infinity.
  The preview now uses bounded input validation; the misleading summary disappeared.
- Correcting protein to 150 and saving produced "Targets saved."
- Export with zero foods, entries and weight readings now works, preserving the ability
  to back up targets alone. The browser displayed "Backup downloaded."

## Implemented since the tour

- Privacy distinguishes website hosting, optional barcode lookups and local personal data.
- Quick-add labels wrap; calorie excess uses neutral text; macro remaining values are visible.
- Unknown routes do not acquire a canonical or Open Graph URL during client navigation.
- HTTP deadlines cover response bodies; byte limits are enforced while reading.
- Barcode responses validate status, identity and numeric values; pacing corrected.
- Import checks File.size before reading; export and reset are not disabled by empty food tables.
- Menu no longer handles Escape twice, and open native dialogs lock background vertical scroll.

## Repeatable checks

- `npm run check:all`: typecheck, lint, token rules, 29 contrast assertions.
- `npm run check:http`: 13 network-free HTTP boundary checks.
- `npm run check:barcode`: network-free format, checksum, pacing and response checks.
- `npm run build`: production output generation, with no source maps configured.

## Still required before completion

- Complete source and staged-change review, including database/import round-trip evidence.
- Recheck camera cleanup and error behavior; do not claim physical-camera verification.
- Full responsive matrix, keyboard/menu behavior, short-height and zoom checks.
  Windows automation could not verify Chrome's URL for native resizing in earlier turns;
  browser-tab automation works. Do not count screenshots at desktop width as mobile proof.
- Consolidate README and remaining privacy wording, social image copy and metadata behavior.
- Inspect production assets, measure gzip sizes, run all checks including formatting and audit.
- Run authorized `npm run publish:site` once combined changes are verified, then inspect live
  routes, headers, redirects, 404 status, metadata and assets.
- Final QA report must separate measured results from remaining limitations.
