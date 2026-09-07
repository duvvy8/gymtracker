# CHECKLIST — muscle heatmap alignment and colour

What was done, in the order it was asked for. Every box below was verified
rather than assumed. Detail and rationale are in [COMPLETED.md](COMPLETED.md);
[UPCOMING.md](UPCOMING.md) is the live coordination board.

## Coordination

- [x] Project instructions in `AGENTS.md` read before any edit
- [x] `GYMTRACKER_GOAL_PROGRESS.md` read for prior context
- [x] `CLAUDE.md` and `AI_COORDINATION.md` confirmed absent, `UPCOMING.md`
      created because it did not exist
- [x] `git status --short` and the staged diff inspected before editing
- [x] No file held by an active claim from the other agent was overwritten
- [x] Region ids, region-to-view mapping, aliases and view selection preserved
      exactly as the other agent left them
- [x] Coordination file kept current through the task and closed out at the end

## Geometry

- [x] Muscle outlines derived from the artwork itself rather than drawn by eye
- [x] Cropped outlines sealed and faded strokes bridged so the background fill
      cannot leak into the body
- [x] Upper front: chest, front delts, side delts, biceps, forearms, abs,
      obliques
- [x] Upper back: traps, rear delts, rotator cuff, lats, mid back, lower back,
      triceps
- [x] Lower front: quads, adductors, abductors and outer hip, hip flexors
- [x] Lower back: glutes, hamstrings, calves
- [x] Fills stop a few pixels inside the drawn contour, so no colour spills
      outside the body
- [x] Internal edges follow drawn lines: clavicle, pectoral curve, deltoid
      line, trapezius border, the curve out of the armpit, gluteal fold, knee
- [x] Left and right sides mirrored from one definition, then clipped to each
      side of the drawing so natural asymmetry in the art is respected
- [x] Body silhouettes traced from the same artwork for the neutral base fill

## Colour

- [x] Four-band green, yellow, orange and red scale removed at the user's
      request
- [x] Single continuous ramp from `--color-heat-soft` to `--color-heat-strong`,
      interpolated in oklab
- [x] Untrained muscles filled with `--color-muscle-base` so "not worked" is an
      explicit state
- [x] One curve, in one function, is the only mapping from percentage to fill
- [x] Legend shows the not-worked swatch and the Less to More ramp, built from
      that same function
- [x] Screen-reader description of the scale, and the percentage bars still
      carry the exact numbers so colour is never the only channel
- [x] Approach cross-checked against how comparable products render muscle maps

## Rendering

- [x] Overlay and image share one coordinate system, verified by identical
      bounding boxes at 320, 360, 390, 430, 768, 1024, 1280 and 1440 pixels
- [x] No breakpoint-specific path sets introduced
- [x] No horizontal overflow at any tested width
- [x] Line art still renders crisply on top of the fills
- [x] No anatomy image regenerated, cropped, restyled or recompressed

## Verification

- [x] Baseline and after states inspected for all four views
- [x] Problem areas inspected at high zoom: sternum, shoulder, armpit, scapula,
      knee, inner thigh
- [x] Checked in the running application, not only in isolation
- [x] Representative machines covered: Chest Press, Pectoral Fly, Lat Pulldown,
      Abdominal Crunch, Leg Press, Hip Adductor, Hip Abductor
- [x] Both consumers checked: the machine dialog and the exercise detail dialog
- [x] Desktop and mobile widths both inspected at normal zoom
- [x] Colour matches the stated percentages on screen
- [x] No console errors in a fresh tab
- [x] Temporary debug overlay used during review was removed, and no debug UI
      ships

## Checks

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run check:tokens`
- [x] `npm run check:contrast`, 29 of 29 pairs
- [x] `npm run check:workouts`, including the updated heatmap assertions
- [x] `npm run build`
- [x] Prettier formatting clean on every touched file
- [x] Regression pass over Today, Log food, Programs, Machines and History
- [x] No pre-existing failures found, so none to attribute elsewhere

## Not done

- [ ] Production deployment. `npm run publish:site` is left to the user for
      this change.
