import {
  BODY_HEATMAP_REGIONS,
  BODY_SILHOUETTES,
  HEATMAP_VIEWS,
  type HeatmapView,
} from '../data/bodyHeatmap';
import { buildHeatmapModel, heatFillForPercent } from '../lib/heatmap';
import type { MuscleEmphasis } from '../types';

/** Sample points along the ramp, shown under the maps as a reading key. */
const LEGEND_STEPS = [15, 40, 70, 100] as const;

function AnatomyView({
  view,
  regions,
}: {
  view: HeatmapView;
  regions: ReturnType<typeof buildHeatmapModel>['regions'];
}) {
  const definition = HEATMAP_VIEWS[view];

  return (
    <div className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-md border border-line bg-surface">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1254 1254"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          {BODY_SILHOUETTES[view].map((path, index) => (
            <path key={`body-${index}`} d={path} fill="var(--color-muscle-base)" />
          ))}
          {regions.flatMap((region) =>
            (BODY_HEATMAP_REGIONS[region.id][view] ?? []).map((path, index) => (
              <path key={`${region.id}-${index}`} d={path} fill={region.fill} />
            )),
          )}
        </svg>
        <img
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          src={definition.assetPath}
          alt=""
          width="1254"
          height="1254"
          decoding="async"
        />
      </div>
      <p className="mt-1 text-center text-xs font-medium text-ink-3">{definition.label}</p>
    </div>
  );
}

export function MuscleHeatmap({ targets }: { targets: readonly MuscleEmphasis[] }) {
  const model = buildHeatmapModel(targets);
  if (model.views.length === 0) return null;

  return (
    <figure role="img" aria-label={model.accessibleSummary}>
      <div
        className={
          model.views.length === 1
            ? 'mx-auto grid max-w-sm gap-3'
            : 'grid min-w-0 gap-3 sm:grid-cols-2'
        }
      >
        {model.views.map((view) => (
          <AnatomyView key={view} view={view} regions={model.regions} />
        ))}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-2xs text-ink-3">
        <span className="sr-only">
          Muscles that were not trained keep the plain body tone. Trained muscles run along one
          scale, from a soft tone for a small share of the effort to a strong tone at 100 percent.
        </span>
        <span aria-hidden="true" className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 shrink-0 rounded-xs border border-line-strong"
            style={{ backgroundColor: 'var(--color-muscle-base)' }}
          />
          <span>Not worked</span>
        </span>
        <span aria-hidden="true" className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="numeric shrink-0">Less</span>
          <span className="flex min-w-0 flex-1 overflow-hidden rounded-xs border border-line-strong">
            {LEGEND_STEPS.map((percent) => (
              <span
                key={percent}
                className="h-3 flex-1"
                style={{ backgroundColor: heatFillForPercent(percent) }}
              />
            ))}
          </span>
          <span className="numeric shrink-0">More</span>
        </span>
      </figcaption>
    </figure>
  );
}
