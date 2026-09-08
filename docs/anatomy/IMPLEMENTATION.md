# Muscle heatmap anatomy assets

The four source images in `originals/` and the four runtime images in
`public/anatomy/lineart/` came from the user-supplied
`gymtracker_heatmap_assets.zip`. They are stored without image conversion,
cropping, recompression, or other visual changes.

The runtime uses only the transparent line-art images. The opaque originals
remain here as approved visual references and are not copied into the
production build.

The supplied upper-body filenames do not match the anatomy shown in them.
`01_upper_front_neck_crop.png` visibly shows the back, while
`02_upper_back_neck_crop.png` visibly shows the chest and abdominals. The
central mapping in `src/data/bodyHeatmap.ts` corrects that presentation issue
without renaming or changing either supplied file.

Muscle percentages remain in `src/data/machines.ts`. The heatmap and the
existing percentage bars both receive that same array. Alias normalization,
view selection, region geometry, and asset paths are centralized in
`src/data/bodyHeatmap.ts` and `src/lib/heatmap.ts`.

`manifest.json` records the five-band colour scale that came with the supplied
pack. The application no longer uses those bands. The map now fills the whole
figure with `--color-muscle-base`, so a muscle that was not trained reads as
part of the body rather than as empty paper, and paints the trained muscles
along one warm ramp between `--color-heat-soft` and `--color-heat-strong`. The
emphasis percentage picks the point on that ramp, so the scale is continuous.

`heatMixForPercent` and `heatFillForPercent` in `src/lib/heatmap.ts` are the
single source of that mapping, and the legend under the maps is built from the
same functions. `BODY_SILHOUETTES` in `src/data/bodyHeatmap.ts` holds the
outline of each figure and is traced from the same line art as the muscles, so
the base fill lands inside the drawn contour.

This arrangement follows what established products do: Fitbod scores every
muscle group from 0 to 100 and colours a body map from it, MuscleSquad draws
frequently trained muscles darker and neglected ones lighter, and the MuscleMap
SDK fills unhighlighted muscles with a default tone and interpolates a colour
scale for the highlighted ones.

## Presentation refinement, 2026-09-08

Every machine card now includes a compact map beside View machine. It uses the
same model, views, paths, colour functions and source percentages as the detail
map. The full map groups the figures on one quiet surface with a compact key,
without a border around each figure. Two views stay side by side on phones.

SVG image elements now place the unchanged source PNG and the fills inside one
coordinate system. A presentation viewBox frames the upper and lower anatomy
more closely, removing excess canvas whitespace without modifying source assets
or traced geometry. The source hashes remain pinned by check:workouts.

COMPLETED.md and CHECKLIST.md were read as historical evidence of Claude's
alignment work. Its geometry and colour decisions are retained. PROJECT-SUMMARY.md
contains older scope and release status; current user requests and AGENTS.md govern
new features and publishing. No outstanding work is claimed by Claude in UPCOMING.md.

## Colour readability refinement, 2026-09-08

Reviewed [MuscleWiki's bodymap legend](https://api.musclewiki.com/documentation)
and [StrengthLog's muscle-map example](https://help.strengthlog.com/help-article/the-home-screen/).
MuscleWiki explicitly separates secondary and tertiary work with warm colours;
StrengthLog's example uses visible pink/red highlights against neutral anatomy.
Only their presentation principles are used; no external artwork is copied.
Fitbod's recovery percentages were also reviewed, but are a different metric
from this catalogue's estimated per-exercise emphasis.

The previous near-neutral low end and dark brown high end are superseded by
neutral grey for unshown regions, visible apricot for low positive values and a
bright vermilion at the top. The continuous scale and shared percentage data
remain intact. Legend samples label 0, 5, 40 and 90 percent; these are
reference colours, not threshold bands.

## Ramp separation, 2026-09-08

A first attempt at the brighter scale ran from `#efb16c` to `#e97860` on a
linear interpolation. Both ends read well on their own, but the whole ramp
covered an OKLab distance of 0.135 while the step from the neutral body tone to
the lowest heat colour was 0.167 by itself. In other words, "worked at all" was
a larger visual jump than "5 percent versus 100 percent", and a 25-percent
muscle was indistinguishable from a 55-percent one on screen.

The shipped ramp runs from `#fcdba8` to `#e8552c`, an OKLab distance of 0.302,
travelling in lightness and saturation together rather than in hue alone.
Catalogue emphasis clusters between 5 and 30 percent, so `HEAT_CURVE` is 0.8:
the curve opens the low end out instead of crowding the common values into the
palest part of the range. Reference points, with distance measured from the
`#e4e6e3` body tone:

| Emphasis | Fill      | Relative luminance | OKLab distance from the body tone |
| -------- | --------- | ------------------ | --------------------------------- |
| 5%       | `#fcd09d` | 0.682              | 0.089                             |
| 25%      | `#f9b181` | 0.532              | 0.148                             |
| 55%      | `#f48c5e` | 0.388              | 0.228                             |
| 90%      | `#eb6238` | 0.267              | 0.316                             |

The 90-percent colour's relative luminance is 0.267, against 0.156 for the
dark brown it replaces. The low-end tint is deliberately distinct from the
neutral anatomy. These checks address visibility, not a claim of WCAG
compliance for individual heat colours; text labels and percentage bars remain
available alongside the colour encoding.
