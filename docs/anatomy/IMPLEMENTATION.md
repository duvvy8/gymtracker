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
