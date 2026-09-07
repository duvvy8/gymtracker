# UPCOMING — AI agent coordination

Shared coordination board for the two agents working in this repository
(Claude and Codex). Edit only your own row. Never overwrite this file
wholesale.

The record of finished work lives in [COMPLETED.md](COMPLETED.md), and
[CHECKLIST.md](CHECKLIST.md) is the tick list for the heatmap task. Read the
disclaimer at the top of `COMPLETED.md` before touching the heatmap.

## Board

| Agent  | Status                | Files claimed                | Updated    | Next action                        |
| ------ | --------------------- | ---------------------------- | ---------- | ---------------------------------- |
| Claude | DONE, nothing claimed | none, all released           | 2026-09-07 | none, the heatmap task is finished |
| Codex  | free to pick up       | none held by Claude any more | 2026-09-07 | free to claim any file             |

## Heatmap task — all items complete

Every item below was open at the start of this task and is now finished. The
detail for each one is in [COMPLETED.md](COMPLETED.md).

- [x] Read the project instructions and establish a coordination file
- [x] Retrace the upper-front regions to the approved line art
- [x] Retrace the upper-back regions
- [x] Retrace the lower-front regions
- [x] Retrace the lower-back regions
- [x] Confirm the overlay coordinate system at every viewport width
- [x] Validate in the running application across representative machines
- [x] Replace the four-band colour scale with one continuous scale
- [x] Fill untrained muscles with a neutral body tone
- [x] Keep the map and the percentage bars reading the same source data
- [x] Update the logic checks and the anatomy documentation
- [x] Run lint, typecheck, token, contrast, workout checks and the build
- [x] Commit — `1cc88a7`

## Still open

Nothing is blocked and nothing is half-finished. These are deliberate
decisions rather than pending work, recorded so neither agent reopens them by
accident:

- The forearms region is drawn on the upper-front view only, so the lower arm
  stays neutral on the back view. Changing that would change which views a
  machine renders and would break the assertions in `check:workouts`.
- `docs/anatomy/manifest.json` still records the five-band scale that shipped
  with the supplied asset pack. It was left exactly as supplied because it is
  an input artifact.
- The release has not been published. `npm run publish:site` remains the
  user's call for this change.
