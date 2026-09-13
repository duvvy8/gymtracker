# GymTracker agent coordination

Read `AGENTS.md`, this file, `ANIMATION_GOAL_PROGRESS.md`, and `UPCOMING.md` before changing code. Historical feature work remains in `GYMTRACKER_GOAL_PROGRESS.md`; heatmap constraints remain in `COMPLETED.md` and `CHECKLIST.md`.

The active Meals redesign and server-side Gemini meal-photo analysis goal is tracked in `MEALS_AI_GOAL_PROGRESS.md`. Read and update that task-specific handoff before changing Meals, nutrition, database, backup, privacy, HTTP, Worker, or Gemini integration code.

## Shared work rules

- Run `git status` and inspect existing diffs before editing. Never overwrite another agent's active or uncommitted work.
- Keep changes narrowly scoped. Preserve previous work unless a documented technical reason requires replacement. Do not reset, clean, force push, or rewrite history.
- Record files currently being modified, unresolved problems, validation, and the exact next task in the progress document after every meaningful checkpoint and before ending a session or committing.
- Keep the handoff tracked in Git. Stage only explicitly scoped files; preserve other staging choices.
- Preserve the paper/pine palette, IBM Plex typography, compact UI, routes, accessibility, local IndexedDB data, and all existing functionality.
- Follow `AGENTS.md` for validated publication via `npm run publish:site`, then verify production home and affected routes.

## Browser requirement

**User override, 2026-09-11:** The user is working on the main screen and explicitly requested no further control of their browser. Use a separate headless browser with an isolated temporary profile for remaining validation. Do not activate, resize, type into, or otherwise operate the user's visible Chrome, cursor, or windows. Earlier visible left-monitor evidence remains valid. This newer preference overrides the visible-browser requirement below until the user changes it.

For UI, animation, responsive or visual work: **Use the visible Google Chrome browser on the LEFT / SECOND monitor.** Keep it there unless a genuine technical reason prevents it. The user has the ChatGPT browser extension in this Chrome environment.

Use this visible instance for inspection, interactions, transitions, debugging, console checks where available, responsive layouts, menus/dialogs, keyboard checks and screenshots. Automated checks supplement rather than replace visible testing. Prefer app-scoped/browser input without moving the physical cursor. Use actual window resizing for mobile-sized checks.

Capture and inspect meaningful screenshots: baseline desktop/mobile; first route transition; navigation/mobile menu; stateful dialog/program interaction; responsive/reduced-motion checkpoint; final desktop/mobile. Avoid repetitive captures; crop a difficult region when useful.

Screenshots prove static states only. Repeatedly operate transitions and judge timing, direction, easing, interruption, responsiveness, flashes, layout jumps, and rapid navigation. Record actual observations, not assumed success.

## Token conservation

Prefer one capable primary agent working sequentially. Sub-agents are prohibited unless genuinely necessary to perform something the primary agent cannot reasonably complete itself. Extra elapsed time is acceptable and is preferable to unnecessary token consumption.

Use targeted searches and narrow reads; reuse findings. Load skills selectively. Run targeted checks during implementation and full checks at meaningful checkpoints. If delegation is unavoidable, record the technical blocker and minimal delegated scope.
