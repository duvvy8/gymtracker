import {
  BODY_HEATMAP_REGIONS,
  BODY_SILHOUETTES,
  HEATMAP_VIEWS,
  type HeatmapView,
} from '../data/bodyHeatmap';
import { buildHeatmapModel, heatFillForPercent } from '../lib/heatmap';
import type { MuscleEmphasis } from '../types';

// Reference samples along the continuous ramp, not categorical cutoffs.
const LEGEND_STEPS = [
  { percent: 0, label: 'Not shown' },
  { percent: 5, label: 'Light' },
  { percent: 40, label: 'Medium' },
  { percent: 90, label: 'High' },
] as const;

// Frame the existing artwork and its fills together, without changing either.
// Upper-body source canvases contain much more whitespace above the drawing.
const VIEW_FRAMES: Record<HeatmapView, string> = {
  upperFront: '170 290 910 840',
  upperBack: '170 290 910 840',
  lowerFront: '330 25 595 1175',
  lowerBack: '330 25 595 1175',
};

function AnatomyView({
  view,
  regions,
  compact,
}: {
  view: HeatmapView;
  regions: ReturnType<typeof buildHeatmapModel>['regions'];
  compact: boolean;
}) {
  const definition = HEATMAP_VIEWS[view];

  return (
    <div className="min-w-0">
      <svg
        className={compact ? 'h-16 w-full' : 'h-auto max-h-56 w-full'}
        viewBox={VIEW_FRAMES[view]}
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
        <image href={definition.assetPath} x="0" y="0" width="1254" height="1254" />
      </svg>
      {!compact ? <p className="mt-1 text-center text-2xs text-ink-3">{definition.label}</p> : null}
    </div>
  );
}

export function MuscleHeatmap({
  targets,
  compact = false,
}: {
  targets: readonly MuscleEmphasis[];
  compact?: boolean;
}) {
  const model = buildHeatmapModel(targets);
  if (model.views.length === 0) return null;

  return (
    <figure
      role="img"
      aria-label={model.accessibleSummary}
      className={compact ? 'w-28 shrink-0' : 'rounded-lg bg-paper p-3'}
    >
      <div
        className={
          compact
            ? 'grid grid-flow-col auto-cols-fr items-center gap-1'
            : model.views.length === 1
              ? 'mx-auto grid max-w-56'
              : 'grid min-w-0 grid-cols-2 gap-x-3 gap-y-4'
        }
      >
        {model.views.map((view) => (
          <AnatomyView key={view} view={view} regions={model.regions} compact={compact} />
        ))}
      </div>
      {!compact ? (
        <figcaption className="mt-4 text-2xs text-ink-3">
          <span className="sr-only">
            Grey means no emphasis is shown. Pale apricot indicates light emphasis, deepening
            through orange to vermilion as emphasis increases. These are reference samples on a
            continuous scale, not measured training effects. Exact estimates are listed in the
            muscle emphasis bars.
          </span>
          <div aria-hidden="true" className="grid grid-cols-4 gap-2 text-center">
            {LEGEND_STEPS.map(({ percent, label }) => (
              <div key={percent}>
                <span
                  className="mx-auto mb-1 block h-2 w-6 rounded-full"
                  style={{ backgroundColor: heatFillForPercent(percent) }}
                />
                <span className="block">{label}</span>
                <span className="numeric">{percent}%</span>
              </div>
            ))}
          </div>
        </figcaption>
      ) : null}
    </figure>
  );
}
