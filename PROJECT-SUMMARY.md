# gymtracker: project summary

## What this is

gymtracker is a local-first nutrition, body-weight and workout-program tracker. Saved foods,
grouped meals, nutrition snapshots, weight readings, settings and programs live in IndexedDB in
the visitor's browser. There are no accounts, cloud sync, analytics or server-side personal-data
records.

The production site is https://gymtracker.kucera.uk. Cloudflare Static Assets serves the app
directly. A small Cloudflare Worker handles only `/api/*`, currently the optional meal-photo
analysis endpoint. Source: https://github.com/duvvy8/gymtracker.

Stack: Vite, React 18, strict TypeScript, React Router, Dexie, Zustand, Tailwind CSS v4, Recharts
and Zod. Barcode scanning uses ZXing and reviewed Open Food Facts data. Optional meal-photo
analysis uses one structured Gemini 3.8 Flash request; a deterministic CoFID 2021 subset replaces
model nutrition for confident generic-food matches.

## Product surfaces

- Today: calorie and macro progress, quick add, grouped meal summaries and legacy entries.
- Meals: Breakfast, Lunch, Dinner and chronologically positioned Snacks for the selected date.
- History: calorie, macro and body-weight trends.
- Programs: local manual or deterministic workout-program creation and editing.
- Machines: the confirmed gym equipment catalogue and exercise guidance.
- Settings: targets, body weight, versioned backup/import and local-data deletion.
- Privacy: exact local, barcode, hosting and optional photo-analysis boundaries.

## Meals and photo analysis

Add Meal supports a single photo, saved foods, barcode lookup, manual food and an optional drink.
The user must review the meal name, amount, nutrition, confidence and uncertainty before saving.
The processed image is transient: it is never placed in IndexedDB, local storage or backups.

Photo analysis is optional. The browser sends a bounded processed image to the same-origin Worker
only after Analyse is pressed. The Worker validates method, origin, MIME type, file signature and
size; rate limits requests; calls Gemini with a server-only secret; validates structured output;
and returns no-store JSON. It does not log or persist request bodies or model output. Saved-food,
barcode, drink and manual workflows remain available when AI is unavailable.

## Data and compatibility

Dexie schema v3 adds a `meals` table and a `mealId` index to component snapshots without rewriting
older data. Flat entries remain visible and keep counting once. Backups export v3 and import v1,
v2 and v3 after whole-file validation and field-by-field rebuilding. Photos and secrets are never
part of a backup.

## Design and accessibility

The established paper/pine palette, IBM Plex typography and compact rectangular controls remain
the design system. The app uses semantic headings and native dialogs, visible focus, labelled
inputs, live feedback, reduced-motion support, keyboard snack-order controls and pointer drag.
Responsive validation covers 320 px through desktop layouts without hiding overflow.

## Security and deployment

The client has a restricted HTTP layer, strict CSP, no dangerous HTML rendering, bounded numeric
and text input, atomic imports and no runtime CDN. `GEMINI_API_KEY` is declared as a required
Cloudflare secret and is ignored locally through `.dev.vars*` and `.env*` rules.

Completed website changes are validated and published with `npm run publish:site`, then the live
home page, `/meals`, `/privacy`, static assets and API behavior are checked directly.
