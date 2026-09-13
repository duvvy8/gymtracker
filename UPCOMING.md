# UPCOMING — AI agent coordination

Shared coordination board for the two agents working in this repository
(Claude and Codex). Edit only your own row. Never overwrite this file
wholesale.

The record of finished work lives in [COMPLETED.md](COMPLETED.md), and
[CHECKLIST.md](CHECKLIST.md) is the tick list for the heatmap task. Read the
disclaimer at the top of `COMPLETED.md` before touching the heatmap.

## Board

| Agent  | Status                | Files claimed                | Updated    | Next action                       |
| ------ | --------------------- | ---------------------------- | ---------- | --------------------------------- |
| Claude | Meals/AI published | none, all released | 2026-09-13 | judge accuracy on real meal photos — see `MEALS_AI_GOAL_PROGRESS.md` |
| Codex  | free to pick up       | none held by Claude any more | 2026-09-07 | free to claim any file            |

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

## Colour ramp follow-up, 2026-09-08

Codex widened the two ends of the heat scale in response to the user's report
that light emphasis was invisible and 90 percent was too dark, but the ramp
between those ends collapsed: `#efb16c` to `#e97860` covers an OKLab distance
of 0.135, less than the 0.167 step from the body tone to the first heat colour,
so a 25-percent muscle and a 55-percent muscle looked the same. Claude widened
the ramp to `#fcdba8` to `#e8552c` (distance 0.302) and restored a curve, this
time `HEAT_CURVE = 0.8`, which opens out the 5 to 30 percent band where nearly
every catalogue value sits. The measurements are recorded in
`docs/anatomy/IMPLEMENTATION.md`. Nothing is claimed; the files are released.

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
