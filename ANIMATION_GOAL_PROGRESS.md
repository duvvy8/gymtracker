# GymTracker Animation Goal Progress

## Session state
Last agent: Codex (single primary agent)
Last updated: 2026-09-11
Branch: main
Latest relevant commit: e4e8f1d (baseline)
Working tree status: initially clean; new coordination documents only
Dev server: not started yet
Production URL: https://gymtracker.kucera.uk
Local URL: http://localhost:5173
Current phase: coordination and baseline
Current files being modified: AI_COORDINATION.md, ANIMATION_GOAL_PROGRESS.md
Last completed task: read requested goal, project instructions, coordination board and historical constraints; verified clean Git state
Exact next task: commit/push initial coordination checkpoint safely; install missing requested skills; start dev server and establish visible left-monitor Chrome baseline before source edits
Known blockers: none established
Known visual issues: baseline inspection pending

## Objective and implementation boundaries
Add restrained, smooth motion to this established app without redesigning it. Preserve all functionality, data, focus, accessibility, responsiveness and performance. Prefer existing CSS and small helpers; no animation runtime dependency without a documented technical need. Use shared semantic motion tokens and reduced-motion handling from the start. Never animate merely because something mounted; avoid stagger, bounce, dramatic zoom, continuous decoration and delays on frequent actions.

Every implementation checkbox requires applicable browser/automated validation, not just written code. Unchecked items below are the continuation plan. Record implementation files, evidence and intentional non-animation decisions under their items as completed.

## A. Coordination and baseline
- [x] Read repository instructions and coordination/history files; check Git branch, status and existing claims.
  - Clean main at e4e8f1d; Claude has released all claims. Preserve heatmap geometry/assets. CLAUDE.md and INSTALL.md absent.
- [x] Create durable operating guidance and this complete initial checklist before animation implementation.
- [ ] Review and track these two documents in a small coordination commit; push only if safe and record result.
- [ ] Check/install requested skills: animate, find-animation-opportunities, improve-animations, review-animations, interaction-design, 60fps-animation, token-efficient-workflow. Record installation paths/results; load selectively.
- [ ] Baseline check:all, check:http, check:barcode and build; record any existing failures separately.
- [ ] Start local server and inspect visible Chrome on left/second display before UI changes; record actual window placement.
- [ ] Capture/inspect baseline desktop and mobile screenshots; exercise routes, mobile menu, dialogs and Programs.
- [ ] Inventory existing motion with targeted reads of tokens, global CSS, App/shell, controls and relevant pages.

## B. Motion design audit
- [ ] Audit route continuity and desktop navigation; choose minimal entry feedback without animating persistent shell.
- [ ] Audit mobile menu opening/closing, spatial origin, focus and rapid interruption.
- [ ] Audit shared dialogs, nested lightboxes and destructive confirmations; preserve native semantics and nested close guard.
- [ ] Audit buttons, toggles, forms, selectors, loading and state changes; reject typing animation and artificial waits.
- [ ] Audit Programs list/create/setup/exercise/edit/review/save/delete flow; decide meaningful step feedback.
- [ ] Audit Machines cards, filters, details and imagery; avoid card stagger and image layout shifts.
- [ ] Audit History chart/range/resize behavior and reduced motion; avoid competing chart animation.
- [ ] Record intentional non-animation choices so future agents do not add unnecessary effects.

## C. Motion system
- [ ] Add small semantic duration/easing/distance token vocabulary in src/styles/tokens.css after baseline.
- [ ] Build reduced-motion behavior into shared CSS/primitives; immediate focus and equivalent functionality.
- [ ] Add only justified reusable helpers; verify no unnecessary dependency, global will-change or JS loop.

## D. Route/page transitions
- [ ] Implement and validate Today/Log continuity with stable shell, immediate input and no blank flash.
- [ ] Validate History/Programs/Machines route families, lazy loading, rapid switches and same-route clicks.
- [ ] Validate Settings/Privacy, deep-link refresh, browser back/forward and sensible scroll behavior.
- [ ] Inspect first route implementation in visible Chrome desktop/mobile and capture foundation checkpoint.

## E. Navigation/menu interactions
- [ ] Desktop hover/active/pressed feedback: no label movement, stable geometry, immediate keyboard outline.
- [ ] Mobile menu opening/closing: short spatial feedback, correct modality/focus/Escape/restoration.
- [ ] Rapid menu toggles and selecting routes interrupt safely without delaying navigation; capture navigation checkpoint.

## F. Dialogs/state transitions
- [ ] Shared dialog enter/exit and backdrop: test mouse, keyboard, Escape, focus and rapid reversal.
- [ ] Machine details, exercise details and nested image lightbox: preserve parent open state and restore focus.
- [ ] Programs step changes/edit/review/save/delete: test full flow and persistence using isolated test data.
- [ ] Other relevant confirmations/expandable areas: implement only purposeful feedback; capture stateful checkpoint.

## G. Microinteraction polish
- [ ] Apply restrained useful button/toggle/selector feedback without moving pointer targets or animating typing.
- [ ] Verify state/loading changes remain immediate; no manufactured loading state or repeated card animation.

## H. Performance
- [ ] Review animated properties: prefer transform/opacity; no repeated layout/expensive paint or permanent hints/timers.
- [ ] Check layout shifts, chart resize and imagery; no fixed-overlay transform/clipping regression.
- [ ] Exercise rapid repeated input; inspect interruption and lower-powered/mobile-conscious behavior.

## I. Accessibility
- [ ] Test prefers-reduced-motion in Chrome: remove spatial motion while preserving visible state and functionality.
- [ ] Test keyboard focus, menu/dialog entry, Escape, restoration, nested dialogs and touch-sized targets.
- [ ] Confirm no invisible interactive surfaces, delayed actions or motion-dependent information.

## J. Browser validation
- [ ] Visible left-display Chrome desktop and actual user window: Today, Log, History, Programs, Machines, Settings, Privacy.
- [ ] Targeted 320px, 375/390px, tablet and desktop widths: overflow, clipping, overlays, menu and charts.
- [ ] Repeated routes/menu/dialogs; Back/Forward; deep-link refresh; console warnings/errors and failed resources.
- [ ] Capture/inspect responsive/reduced-motion and final desktop/mobile checkpoints; record screenshot paths and observations.
- [ ] Preserve nutrition logging/saved foods/quantity/delete/weight, program persistence, settings backup and camera context; supplement browser smoke checks with existing regressions.

## K. Automated regression
- [ ] Targeted checks for changed motion lifecycle/behavior during implementation.
- [ ] Final check:all (typecheck, lint, tokens, contrast, workouts).
- [ ] Final check:http.
- [ ] Final check:barcode.
- [ ] Final production build.

## L. Final review and handoff
- [ ] Use review-animations skill on actual implementation; fix substantive timing/interruption/performance/accessibility findings.
- [ ] Inspect final source diff for unrelated files, junk, logs, temporary CSS, unused helpers and duplicated constants.
- [ ] Final visible browser review after regression; record remaining limitations honestly.
- [ ] Publish completed validated changes using npm run publish:site; verify live home and affected routes/assets.
- [ ] Update all checkboxes/session state, exact continuation if anything remains, files/tests/screenshots and relevant commit information; keep handoff tracked.

## Checkpoint log
- 2026-09-11: Initial clean checkout verified. No source implementation yet. No sub-agents used. Full pasted brief read; this file is the durable continuation plan.
