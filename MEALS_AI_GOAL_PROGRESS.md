# GymTracker Meals + AI Goal Progress

## Session state

- **Last agent:** Claude (continuing Codex's work; single primary agent, no sub-agents)
- **Last updated:** 2026-09-13 17:47 BST
- **Branch:** `main`
- **Latest relevant commit:** `e051c6f` (baseline; all Meals/AI work below is uncommitted)
- **Working tree state:** Meals/Worker/data/docs/test changes uncommitted. Ignored browser evidence in `.animation-evidence/`. This handoff is staged so it is tracked in Git as the goal requires.
- **Current phase:** Published. Remaining work is accuracy judgement on real meal photographs.
- **Current files being modified:** none in flight; last touched `worker/index.ts`, `src/lib/mealAnalysis.ts`, `scripts/check-meals.mjs`, `.animation-evidence/meals-qa.cjs`
- **Last completed task:** First real Gemini calls made. The corrected request shape is accepted by the live API. Two error states the goal requires but that collapsed into a generic failure — no food detected, and transient upstream unavailability — are now distinct and verified end to end.
- **Exact next task:** Judge analysis quality on real meal photographs across the goal's test categories (separated meal, mixed dish, breakfast, ambiguous food, visible sauce/oil, meal with drink). Then rerun the isolated browser QA, provision production with `npx wrangler secret bulk .dev.vars`, publish on authorisation, and verify production.
- **Known blockers:** Needs real meal photographs from the user to judge decomposition and portion accuracy; a gym-machine fixture only exercises the no-food path. Publication still requires the user's explicit authorisation.
- **Known UI issues:** None outstanding. Two were found and fixed (see I below): low-confidence items previously required editing the AI's confidence label to clear them, and manual nutrition edits were stored per-100 rather than as confirmed item totals.
- **Known AI/API issues:** **The free tier allows only 20 requests per day for `gemini-3.8-flash`** (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, limit 20, confirmed from the live 429 body). This is the binding operational constraint on the whole feature and needs a decision — see Open questions. Transient 503 UNAVAILABLE is also frequent; the Worker now retries it once, which is quota-neutral compared with the user pressing Analyse again.
- **Gemini model currently selected:** `gemini-3.8-flash`, `thinkingConfig.thinkingLevel: MEDIUM`, one structured multimodal `generateContent` request, no tools, no Search grounding
- **Gemini API status:** Verified working. Auth, image input, `responseSchema` structured output and `thinkingConfig.thinkingLevel: MEDIUM` all confirmed against the live endpoint using the Worker's exact request body.
- **Local secret configured:** yes (presence and shape checked only; the value was never printed, logged or written to any file)
- **Production secret configured:** yes. Uploaded to the `gymtracker` Worker with `wrangler secret bulk .dev.vars` and confirmed via `wrangler secret list` as `GEMINI_API_KEY` of type `secret_text`. Encrypted at rest; the value is not retrievable.
- **Local validation status:** green. `check:all` (9 suites, 31 Meals checks, 5 secret-hygiene checks) and the production build pass as of this update.
- **Production deployment status:** deployed to https://gymtracker.kucera.uk, Cloudflare version `87d9e371-9d06-4e09-8342-833b7d704ade`.

## Official documentation verification (goal section A.4 / A.5)

Performed 2026-09-13, having previously been asserted without evidence.

| Question | Finding | Source |
| --- | --- | --- |
| `gemini-3.8-flash` still available? | Yes, stable | [models](https://ai.google.dev/gemini-api/docs/models) |
| Accepts image input? | Yes, `inlineData` parts confirmed | [Gemini 3 guide](https://ai.google.dev/gemini-api/docs/generate-content/gemini-3) |
| Free tier? | Yes, free of charge for input and output; image not priced separately | [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Thinking shape? | `generationConfig.thinkingConfig.thinkingLevel`, values LOW/MEDIUM/HIGH, MEDIUM is the default for 3.8 Flash; MINIMAL unavailable | [thinking](https://ai.google.dev/gemini-api/docs/generate-content/thinking) |
| Structured output field? | `responseSchema` is documented. `responseJsonSchema` appears in none of four reads. Supported keywords are a JSON Schema subset excluding `additionalProperties`, `minItems`, `maxItems`, `maxLength`. | [structured output](https://ai.google.dev/gemini-api/docs/structured-output), [REST reference](https://ai.google.dev/api/generate-content) |
| Rate Limiting binding shape? | `ratelimits[].simple.period` must be 10 or 60. Ours is 60. Free-plan availability is not stated in the docs and will be proven at first deploy. | [rate limit binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) |

Note: the `generateContent` endpoint is now labelled "Legacy" against a newer Interactions API. It remains valid and is what this Worker targets. Migrating is explicitly out of scope for this goal.

## Architecture and security decisions

- Static files keep direct Cloudflare Static Assets delivery. Only `/api/*` runs the module Worker via `assets.run_worker_first`, so existing `_headers` behaviour and the static-route/404 architecture are untouched.
- `/api/analyse-meal` accepts one bounded image body, rejects cross-origin use, validates MIME and file signature, rate limits by Cloudflare actor key, and returns explicit no-store security headers.
- `GEMINI_API_KEY` exists only as a required Worker secret. `.dev.vars*` and `.env*` are ignored; `.dev.vars.example` holds only a placeholder.
- One direct REST `generateContent` request. No SDK, no retry, no Search grounding, no request-body or model-output logging.
- **The provider schema is a hint; `analysedMealSchema` (Zod, strict) is the trust boundary.** The provider schema carries only documented keywords; component count, string lengths, numeric bounds and unknown-key rejection are enforced after generation regardless of what the model returns.
- Images are resized locally to a JPEG no larger than 1600 px per edge and 5 MB. Object URLs are revoked; image bytes never reach IndexedDB, local storage, backups, source or retained UI state.
- Gemini returns components, preparation, amount, confidence, uncertainty, per-100 nutrition, and lookup terms. A compact attributed CoFID 2021 subset deterministically replaces model nutrition on a confident match.
- Confirmed component snapshots are the only values Today and History sum. Meals carry grouping metadata only, so nothing is double counted.

## A. Coordination

- [x] Read agent files (`AGENTS.md`, `AI_COORDINATION.md`, `UPCOMING.md`, progress docs) before source edits.
- [x] Inspect git state; preserve other agents' work. No history rewrite, reset or force operation was used.
- [x] Establish task handoff; referenced from `AI_COORDINATION.md`; tracked in Git.
- [x] Verify current official Gemini docs — see table above. Previously unrecorded; now done.
- [x] Verify current official Cloudflare docs — binding shape and period values confirmed; free-plan availability remains unproven until deploy.
- [x] Follow the newer isolated/headless-browser override; the visible browser, cursor and windows were never controlled.
- [x] Single primary agent throughout; no sub-agent was used.

## B. Architecture

- [x] Worker API-only architecture (`worker/index.ts`, `wrangler.jsonc`).
- [x] Static asset routing preserved (`run_worker_first: ["/api/*"]`, `html_handling`, `not_found_handling: 404-page`).
- [x] Static security headers preserved; API responses set their own explicit no-store header set.
- [x] Gemini provider boundary isolated in the Worker; no provider details leak into UI code.
- [x] Secret declared as required (`secrets.required: ["GEMINI_API_KEY"]`).
- [x] `.dev.vars.example` added with a placeholder only.
- [x] Real secret files ignored — verified with `git check-ignore`.
- [x] **Secret hygiene is enforced automatically** by `scripts/check-secrets.mjs`, wired into `check:all`. It fails the build if `.dev.vars` becomes tracked or appears in history, if the `.gitignore` rules for `.dev.vars`, `.env`, `dist/` or `.wrangler/` are lost, if the tracked example stops being a placeholder, or if any tracked or untracked-but-committable file contains key-shaped material. Negative-tested with a planted key.

## C. Meals data model

- [x] Meal grouping, category, four chronological snack slots, drink kind, confidence, uncertainty, provenance and secondary nutrients (`src/types/index.ts`, `src/db/schema.ts`).
- [x] Dexie v3 `meals` table and `foodLogs.mealId` index without rewriting v1/v2 data.
- [x] Validated atomic create/update/delete through `src/db/queries.ts`; the validation layer is not bypassed.
- [x] Legacy flat food logs remain readable and editable as ungrouped records.
- [x] Backup v3 exports meals and enriched components; v1/v2/v3 import through strict schemas.
- [x] A real browser-created v2 database was upgraded to v3 with its legacy entry intact.

## D. Nutrition resolver

- [x] Official CoFID 2021 values extracted from the GOV.UK workbook; only a compact attributed subset ships (`src/data/cofid.ts`), not the 4.42 MB source.
- [x] Trace represented as zero; salt derived as sodium x 2.5 / 1000.
- [x] Deterministic scaling of all eight nutrients for g, ml or servings.
- [x] Alias matching with explicit high/medium thresholds; `ai-estimate` retained when no confident match exists.
- [x] **Model-supplied `nutritionLookupTerms` and `possibleAliases` now feed the resolver.** The goal specified these; they were missing, leaving the resolver to match on name and preparation alone. Added to the provider schema, the prompt, and `resolveCofid`, which now tries each term and keeps the best match.
- [x] **A reference match no longer raises the model's identity confidence.** It previously overwrote `identityConfidence` with the match confidence, so an exact CoFID hit on a food Gemini was unsure about displayed as High and skipped the review gate. It now takes the lower of the two, keeping uncertainty honest (goal priority 4).
- [x] Source and provenance retained internally (`nutritionSource`, `referenceCode`, `referenceName`, `referenceUrl`) without cluttering the main UI.

## E. Meals page

- [x] "Log food" renamed to Meals across desktop nav, mobile menu, titles, route metadata, footer, `llms.txt` and README.
- [x] `+ Add Meal` is the primary action.
- [x] Breakfast / Lunch / Dinner sections for the selected day.
- [x] Four chronological snack positions around the fixed anchors, preserving order within an interval.
- [x] Pointer and touch drag via an explicit handle, with visible Move earlier / Move later buttons as the non-drag equivalent.
- [x] Date navigation retained; placement persists across reload (verified in the isolated browser).
- [x] Legacy ungrouped entries still display and edit.
- [x] `/meals` is canonical; `/log` resolves as an alias rather than a soft 404.

## F. Existing food methods

- [x] Saved foods manager retained in full at `/foods`, linked from Meals.
- [x] Barcode scanning and Open Food Facts lookup unchanged (lazy-loaded).
- [x] Manual entry unchanged.
- [x] AI-detected components do not pollute Saved Foods.

## G. AI image UI

- [x] Native `<input type="file" accept="image/*">`; no faked iOS sheet; camera is not forced. **Corrected after user report:** the input shipped with an explicit MIME list, so iOS Safari offered only the Files browser with no Take Photo or Photo Library option, and iPhone HEIC camera-roll photos were excluded outright. Image preparation now accepts anything the platform reports as an image and decodes with EXIF orientation applied, still re-encoding to JPEG.
- [x] One photo per meal.
- [x] Concise whole-meal framing hint.
- [x] Local preview with replace and remove; object URLs revoked.
- [x] Privacy disclosure with a Privacy link shown before Analyse.
- [x] Honest indeterminate loading text, no fake percentages.
- [x] Cancel aborts the in-flight request; one active controller plus a 10-second cooldown prevents duplicates.
- [x] Replacing the image clears stale results.
- [x] **Removing a photo and choosing the same file again now works.** The file input's value was never cleared, so re-picking an identical file fired no change event and the UI silently did nothing. Found by running the browser QA for the first time.
- [x] Error states mapped for missing config, quota, timeout, bad image, malformed response, upstream failure and offline, with no raw errors surfaced.
- [x] **No food detected is now its own state.** The model reports a non-food photo as `items: []`, which failed the minimum-one-item rule and surfaced as the generic "could not be analysed". It now returns 422 `no-food-detected` with a message telling the user to retake the photo or add the food another way.
- [x] **Transient upstream unavailability is now its own state.** A provider 5xx returned the same generic failure as a permanent one. It now returns 503 `analysis-unavailable` with `Retry-After`, and reads as retryable. No automatic retry was added, so quota is never burned without the user asking.

## H. Gemini

- [x] Current free Flash-class model selected and doc-verified.
- [x] Image input via `inlineData`.
- [x] **Structured output now uses the documented `responseSchema`.** It previously sent `responseJsonSchema` with `additionalProperties`, `minItems`, `maxItems` and `maxLength` — a field appearing in no current documentation, carrying keywords outside the supported subset. That was a likely 400 on the first real call. Strictness is unchanged because Zod enforces every bound after generation.
- [x] `thinkingLevel: MEDIUM` confirmed correct for 3.8 Flash.
- [x] Prompt-injection resistance: image pixels and any visible text are declared untrusted data; the system instruction forbids following in-image instructions, altering the schema, exposing prompts, or returning code or HTML. Output is validated regardless.
- [x] Strict post-generation schema with bounded counts, lengths and numeric ranges.
- [x] Independent Worker-side validation of method, origin, content type, size, signature and provider output.
- [x] Quota and rate-limit handling without auto-retry.
- [x] **Exercised against the real endpoint.** The Worker's exact request body returns HTTP 200 with valid structured output. Auth, image input, `responseSchema` and `thinkingLevel: MEDIUM` are all confirmed working, which also proves the structured-output correction above.
- [ ] **Judge analysis quality on real meal photographs.** Not yet possible: the only local fixture is a gym-machine image, which exercises the no-food path rather than decomposition, portion realism or CoFID resolution. Needs the user's test meals across the goal's six categories, and must not be tuned against a single lucky image.

## I. Review UI

- [x] AI meal name, editable.
- [x] One editable card per component.
- [x] Editable amount with deterministic instant recalculation; no second AI call.
- [x] Core macros readable; secondary nutrients behind progressive disclosure.
- [x] Confidence and uncertainty shown honestly.
- [x] Change food / match reference, and remove.
- [x] **Manual overrides store the confirmed item total.** They were previously written as per-100 values, so the saved log did not match what the user confirmed on screen.
- [x] **Low-confidence items clear by explicit review, not by editing the AI's confidence label.** A `reviewed` flag with an "I reviewed this estimate" checkbox replaced that; correcting the food, amount or nutrition also satisfies it. Only genuinely low-confidence items are gated.
- [x] Overrides survive amount changes and are only discarded by the explicit Reset to calculated nutrition action.
- [x] Explicit gram-change feedback: an inline status line, not a modal.
- [x] Live meal totals.

## J. Drink

- [x] Optional `+ Add drink`; the panel is not shown until requested.
- [x] Attached on desktop, stacked on mobile.
- [x] 250 ml glass, 330 ml can, 500 ml bottle, custom ml — every preset resolves to a visible, editable ml value.
- [x] Zero-nutrition water; protein shake with macros; editable nutrition drink.
- [x] Stored inside the same meal and counted exactly once.

## K. Privacy and security

- [x] Photo never persisted to IndexedDB, local storage, KV, R2, logs, analytics or backups.
- [x] API key is server-only; never in source, `VITE_*`, config vars, HTML or the bundle.
- [x] **Git history audited.** No key material has ever been committed: no match for the live key, for `AIza`- or `AQ.`-shaped strings, and `.dev.vars` appears in no commit. Nothing sensitive is on the public GitHub repository, and the local branch is not ahead of `origin/main`.
- [x] **Production key stored as a Cloudflare encrypted secret**, not a plaintext var, provisioned from the same ignored local file so it was never retyped or pasted into chat.
- [x] Request size, body size and provider response size limits.
- [x] MIME allow-list plus file-signature validation.
- [x] Rate limiting binding plus client cooldown.
- [x] **Same-origin enforcement now requires positive proof.** The check previously rejected only headers that were present and wrong, so a scripted POST carrying neither `Origin` nor `Sec-Fetch-Site` passed and could spend the quota freely. It now demands a matching `Origin` or `Sec-Fetch-Site: same-origin`. Verified against the running Worker: a header-less POST and a cross-origin POST both get 403 without reaching the provider, while a browser-shaped request still completes.
- [x] `Cache-Control: no-store` on API responses.
- [x] No request-body, image, model-output or key logging; observability sampled at 1%.
- [x] Privacy page states the local/transient boundary, the Google free-tier product-improvement disclosure, and the non-AI alternatives.
- [x] README, project summary, `llms.txt`, footer and route metadata corrected.
- [x] Outdated "no server" and "nothing leaves the device" claims removed.
- [x] Gemini kept out of the client CSP `connect-src`; the browser calls same-origin only. Confirmed: `generativelanguage` appears nowhere in `dist`.

## L. Downstream integration

- [x] Today totals sum component snapshots once and render grouped meals plus legacy entries.
- [x] History aggregates the same snapshots once; existing charts unaffected.
- [x] No double counting between meal totals and components.
- [x] Export includes meal metadata and components, excludes photos.
- [x] Import accepts v1, v2 and v3 backups.

## M. Responsive and accessibility

- [x] No page or dialog horizontal overflow at 320, 375, 390, 768 and 1280 px (isolated headless Chromium).
- [x] Mobile and desktop screenshots inspected; paper/pine palette and IBM Plex retained, no redesign.
- [x] Native dialog focuses Meal name, closes on Escape, scrolls above the fixed footer, restores focus.
- [x] All fields labelled; icon controls have accessible names; method tabs expose selected state.
- [x] Keyboard and single-click alternatives to pointer drag, with an on-screen handle.
- [x] Reduced motion removes dialog transitions; no state depends on animation completion.
- [x] No console or page errors during the completed local flow.

## N. Testing

- [x] Nutrition maths, gram editing, meal totals, secondary nutrients, drink maths.
- [x] Snack ordering and persistence.
- [x] Meal grouping, legacy logs, Dexie migration, v1/v2/v3 backups.
- [x] Gemini output validation, malformed responses, absurd values, low-confidence states, Worker error mapping, missing secret, quota failure.
- [x] Provider request assertions: one request, no tools, `thinkingLevel: MEDIUM`, documented `responseSchema` only, and no unsupported schema keywords.
- [x] Lookup-term rescue and confidence-not-raised regressions added.
- [x] No live Gemini calls in any check; the provider is stubbed and CI needs no key.
- [x] `check:all` green: typecheck, lint, design tokens, 29/29 contrast, workouts, 13 HTTP, barcode, 30 Meals, 5 secret-hygiene.
- [x] Production build succeeds; `wrangler --dry-run` reads 95 assets and reports only the rate-limit and asset bindings.
- [x] Isolated browser flow: `/log` alias, save/group/display, snack reorder and reload, Today, v3 export, preview and revoke, responsive layout, reduced motion, missing-secret fallback, v2 migration.
- [x] Real-provider verification of the no-food and upstream-unavailable paths end to end through the Worker.
- [x] **Isolated browser QA re-run: 16 of 16 checks pass**, including the low-confidence review assertion that had never executed, the v2 to v3 migration, responsive layout at five widths, reduced motion, and no browser runtime errors.

## O. Final handoff

- [x] Final diff reviewed: no debug logging, no TODO markers, no key material, no private photographs.
- [x] No key committed — `.dev.vars` ignored; `GEMINI_API_KEY` appears in tracked files only as a name in `wrangler.jsonc` and `PROJECT-SUMMARY.md`; no value in `dist`.
- [x] No private photo committed; browser evidence stays in ignored `.animation-evidence/`.
- [x] No debug logging.
- [x] Progress document accurate — restored to the goal's mandated Session state block and A–O structure.
- [x] Exact remaining task documented.
- [x] Deployment state documented: Cloudflare version `9967978b-c943-47df-975b-980d5dae0a7f`, commit `0cf2365` on `origin/main`.
- [ ] Mark the goal complete only after the real provider run, full revalidation, publication and production verification genuinely finish.

## Open question: free-tier daily quota

The live 429 body is explicit:

```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
limit: 20, model: gemini-3.8-flash
quotaId: GenerateRequestsPerDayPerProjectPerModel-FreeTier
```

**Twenty analyses per day, per model, on the free tier.** The goal requires the
system to stay usable on the free tier, and 20 per day is tight for a food
tracker used at every meal, especially with any retrying or experimentation.

Options, none yet chosen by the user:

1. Accept 20 per day. Roughly three or four meals daily with no room for error.
   Costs nothing and needs no change; the app already degrades cleanly to
   barcode, saved foods and manual entry when quota is gone.
2. Move to a lighter free Flash-class model with a higher daily allowance. The
   provider boundary is already isolated in the Worker, so this is a one-line
   model change plus revalidation. Google no longer publishes per-model free
   limits in its docs; they are visible per account at https://ai.dev/rate-limit.
3. Keep `gemini-3.8-flash` for quality and fall back to a lighter model only
   after a quota failure. More code, and it would need its own error states.

Deliberately not an option under the current goal: enabling billing.

## Deliberate decisions, not pending work

Recorded so no future agent reopens them by accident.

- **Google-side API key restriction is deferred.** The user chose on 2026-09-13 not to restrict the key to the Generative Language API in the Google console. It is defence-in-depth that only changes the blast radius after a leak, and the leak paths are already closed: the key is never in the repository (enforced by `check:secrets`), lives only in the Cloudflare encrypted secret store, and never reaches the browser. Revisit only if the key is ever suspected exposed.
- **No CAPTCHA or bot challenge on `/api/analyse-meal`.** The goal explicitly rules this out without evidence of abuse. The Worker rate limit, same-origin enforcement and size/MIME validation are the controls in place.
- **No automatic retry on provider failure**, including the frequent transient upstream 503, so quota is never spent without the user asking.

## Remaining work, in order

1. **User:** create `.dev.vars` in the repository root containing `GEMINI_API_KEY="YOUR_KEY_HERE"` with the real key. Do not paste it into chat. The file is already gitignored.
2. Run one real local photo analysis. Judge decomposition, gram realism, CoFID resolution versus `ai-estimate` fallback, confidence honesty, and the correction flow. Do not tune the prompt against a single lucky image — use several of the goal's test meals.
3. Re-run the isolated headless browser QA and `npm run check:all`.
4. Provision production with `npx wrangler secret bulk .dev.vars` (verify current Wrangler syntax first). Never print the file.
5. Review the final diff, then publish with `npm run publish:site` once the user authorises it.
6. Verify live `/`, `/meals`, `/log`, `/foods`, `/privacy`, static headers, and `/api/analyse-meal`; confirm no key in browser JS or network responses; test a real meal photo; confirm the photo is not persisted and that the meal, snack order and daily totals survive reload.
7. Record the Cloudflare deployment version and URL, and the final Git state. Do not push without separate authorisation.

## Checkpoint log

- **2026-09-13 15:09 BST (Codex):** Architecture, data, UI, Worker, CoFID, privacy/docs and non-provider validation implemented. First save exposed an over-tight `sortOrder` bound; photo preview exposed a missing `blob:` CSP allowance. Both corrected, isolated-browser suite then passed. Wrangler's local runtime supports compatibility dates to 2026-09-10, so that date is used. Session ended at the `.dev.vars` checkpoint.
- **2026-09-13 17:02 BST (Claude, continuing):** Codex's session ended mid-edit. Findings and actions:
  - `.animation-evidence/meals-qa.cjs` had an unbalanced paren from an interrupted edit, failing `eslint` and therefore the whole `check:all` chain. The handoff had recorded the suite as green. Fixed, then verified green rather than assumed.
  - Performed the goal's A.4/A.5 documentation verification, which had never been recorded. Confirmed model availability, image input, free tier and thinking shape. Found `responseJsonSchema` undocumented and the schema carrying unsupported keywords; switched to `responseSchema` with subset-safe keywords. Zod remains the enforcement boundary, so validation strictness is unchanged.
  - Corrected an earlier concern of my own: `thinkingConfig.thinkingLevel: MEDIUM` is right for 3.8 Flash. Codex's structure was correct.
  - Added the goal's specified `nutritionLookupTerms` and `possibleAliases`, absent from the schema, and wired them into `resolveCofid` to improve the deterministic match rate.
  - Stopped CoFID matches from raising the model's identity confidence, which had been masking low-confidence items from the review gate.
  - Extended `check:meals` from 26 to 28 checks covering the three corrections.
  - Confirmed Codex's two final UX fixes (review flag, item-total overrides) had fully landed.
  - Verified `check:all` green, production build clean, `wrangler --dry-run` clean, and no secret in the bundle or tracked files.
  - Still blocked on `.dev.vars`. No real provider call, no commit, no deployment.
- **2026-09-13 17:47 BST (Claude, real-provider checkpoint):** The user supplied `.dev.vars`; its presence and shape were checked without ever reading, printing or copying the value.
  - A stale `wrangler dev` from Codex's 15:19 session was still holding port 8787 and answered the first call with `analysis-not-configured`, since it had started before the secret file existed. Killed it; only then did calls reach the current Worker.
  - Auth, image input, `responseSchema` and `thinkingLevel: MEDIUM` were each confirmed in isolation and then together using the Worker's exact request body: HTTP 200 with valid structured output. The structured-output correction is therefore proven against the live API, not just against documentation.
  - Gemini answers a non-food photo with `items: []`. That failed the minimum-one-item rule and surfaced as the generic "could not be analysed", so the goal's distinct "no food detected" state did not exist. Added as 422 `no-food-detected`.
  - The free tier returned transient 503 UNAVAILABLE on 3 of 8 calls, which was also collapsing into the generic hard failure. Added as 503 `analysis-unavailable` with `Retry-After`, still with no automatic retry.
  - Both new states were then verified end to end through the running Worker against the live API.
  - `check:meals` extended to 30 checks; `check:all` and the production build are green.
  - Remaining: quality judgement on real meal photographs, isolated browser QA rerun, then production provisioning and publication on the user's authorisation.
- **2026-09-13 17:58 BST (Claude, secret hardening):** At the user's request, audited public exposure before any further work.
  - Git history audit: the live key, `AIza`-shaped and `AQ.`-shaped strings, and `.dev.vars` itself appear in no commit on any branch. All 43 currently committable files were scanned and are clean. Nothing sensitive has ever reached the public repository.
  - Provisioned the production secret with `wrangler secret bulk .dev.vars`, reusing the same ignored local file so the key was never retyped. `wrangler secret list` confirms `GEMINI_API_KEY` as `secret_text` on the `gymtracker` Worker.
  - Added `scripts/check-secrets.mjs` and wired it into `check:all`, so the goal's SECRET LEAK CHECK is enforced by the build rather than by anyone remembering to run it. Negative-tested with a planted key: it fails, names the file, and never prints a value.
  - `check:all` is green across nine suites.
- **2026-09-13 18:02 BST (Claude, endpoint hardening):** Reviewed who can reach the key and who can spend it.
  - The key itself is unreachable: it lives only in the Cloudflare encrypted secret store, is injected at runtime, appears in no bundle or response, and no raw upstream error is ever surfaced.
  - Found and closed a real abuse path. The same-origin guard only rejected headers that were present and wrong, so a plain scripted POST with neither `Origin` nor `Sec-Fetch-Site` was accepted and forwarded to Gemini. This is how an earlier `curl` reached the provider during testing. The guard now requires positive proof of same-origin.
  - Verified live: header-less POST 403, cross-origin POST 403, neither reaching the provider; browser-shaped request still completes normally.
  - `check:meals` extended to 31 checks, asserting the provider is not called for a header-less request. `check:all` green across nine suites.
- **2026-09-13 18:12 BST (Claude, pre-publication validation):** Ran the isolated browser QA, which had never been executed.
  - Two bugs in the QA script itself, both from being written but never run: the mocked response omitted `nutritionPer100`, which the client schema requires, and the second photo selection was clicked without waiting for the preview.
  - That second failure then exposed a genuine product bug. `replacePhoto(null)` cleared React state but never cleared the file input's value, so removing a photo and choosing the same file again fired no change event and the UI did nothing at all. Fixed by clearing the input after each selection.
  - One stale assertion corrected: it expected 503 `analysis-not-configured`, which was only true before a secret existed. It now asserts that any analysis failure stays calm, returns a short JSON error code with no raw upstream detail, and sets no-store.
  - Result: 16 of 16 browser checks pass. `check:all` green across nine suites.
- **2026-09-13 18:15 BST (Claude, published):** Committed `0cf2365`, pushed to `origin/main`, and deployed with `npm run publish:site`.
  - Cloudflare version `9967978b-c943-47df-975b-980d5dae0a7f` on the custom domain. 21 assets uploaded, 62 unchanged. Bindings are the rate limiter and assets only.
  - Production verified rather than assumed: `/`, `/meals`, `/log`, `/foods` and `/privacy` all 200; an unknown path still returns a real 404 rather than a soft one; `/meals` renders with the correct title.
  - The served JavaScript contains no key material and no reference to `generativelanguage`, confirming the browser never calls the provider directly. Static CSP, `nosniff`, `DENY` and `no-referrer` headers are intact.
  - API boundaries live: GET 405, unknown `/api/*` 404, header-less POST 403, cross-origin POST 403, `Cache-Control: no-store` present.
  - End-to-end analysis confirmed in production through the Cloudflare encrypted secret, returning the correct structured result. The secret survived deployment.
  - Remaining: judge decomposition and portion accuracy on real meal photographs. Everything else in the goal is complete.
- **2026-09-13 18:21 BST (Claude, photo picker fix):** The user reported that no photo prompt appeared on mobile.
  - Cause: the input shipped `accept="image/jpeg,image/png,image/webp,image/gif"` rather than the `image/*` the goal specified. iOS Safari treats a narrow accept list as a Files-only picker, so Take Photo and Photo Library never appeared. Compounding it, iPhone camera-roll photos are HEIC, which that list excluded, so even a successful pick would have been rejected by `prepareMealImage`.
  - Fixed: `accept="image/*"` with no `capture`, so the camera is offered but never forced. Preparation now accepts any platform-reported image type and lets decoding be the gate, still re-encoding to JPEG for the Worker's signature check.
  - Also decodes with `imageOrientation: 'from-image'`, so an EXIF-rotated phone photo is no longer analysed sideways.
  - 16 of 16 browser checks and `check:all` still green. Verified live: the production bundle contains `image/*` and no longer contains the restrictive list. No service worker exists, so no stale cache can mask the fix.
- **2026-09-13 18:33 BST (Claude, quota discovery and retry):** The user reported an analysis failing with the busy message on a real photo.
  - Cause was a genuine upstream 503 from Google, not anything the user did. The wording implied otherwise, so it now says plainly that Google's service is overloaded and that the photo is still there to retry. Verified in code: a failed analysis keeps the photo and sets no cooldown, so pressing Analyse again immediately works.
  - The Worker now retries a transient 5xx exactly once, after 700 ms, and never retries a 4xx or a 429. This is quota-neutral compared with the user pressing Analyse again, and turns the common transient failure into an invisible one.
  - While measuring the improvement, every call began returning 429. The cause is the free-tier cap of 20 requests per day for this model, recorded above as an open question. Verification during this session consumed most of today's allowance, so real-photo accuracy testing must wait for the daily reset.
  - `check:meals` extended to 33 checks covering retry-once, transient-then-success, and never-retry-on-4xx. `check:all` green.
