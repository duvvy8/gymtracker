import {
  BODY_HEATMAP_REGIONS,
  HEATMAP_VIEW_ORDER,
  MUSCLE_ALIASES,
  type HeatmapView,
  type MuscleRegionId,
} from '../data/bodyHeatmap.ts';
import type { MuscleEmphasis } from '../types';

export interface ActiveHeatmapRegion {
  id: MuscleRegionId;
  percent: number;
  /** How far along the heat ramp this muscle sits, from 0 to 1. */
  mix: number;
  /** The ready-to-use fill for this muscle. */
  fill: string;
}

export interface HeatmapModel {
  views: HeatmapView[];
  regions: ActiveHeatmapRegion[];
  accessibleSummary: string;
}

/**
 * The map paints the whole figure in the muscle base tone and then paints the
 * trained muscles along a single warm ramp. `heatMixForPercent` returns how
 * far along that ramp a percentage sits. Every positive share starts at a
 * visible apricot tint, separate from the neutral base. The high end is bright
 * vermilion, not dark brown. Zero emphasis is left at the base tone.
 *
 * Catalogue emphasis clusters between 5 and 30 percent, so a linear ramp would
 * leave most muscles crowded into the pale end of the colour range and hard to
 * tell apart. The curve below opens the low end out while still rising all the
 * way to the top, so a supporting muscle is legible and a 25 percent share and
 * a 55 percent share are visibly different.
 */
const HEAT_CURVE = 0.8;

export function heatMixForPercent(percent: number): number {
  if (percent <= 0) return 0;
  const share = Math.min(percent, 100) / 100;
  return Number((share ** HEAT_CURVE).toFixed(4));
}

/** The fill for a muscle, as a point on the ramp between the two heat tokens. */
export function heatFillForPercent(percent: number): string {
  if (percent <= 0) return 'var(--color-muscle-base)';
  const mix = (heatMixForPercent(percent) * 100).toFixed(2);
  return `color-mix(in oklab, var(--color-heat-strong) ${mix}%, var(--color-heat-soft))`;
}

export function normalizeMuscleName(name: string): MuscleRegionId | undefined {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
  return MUSCLE_ALIASES[normalized];
}

export function buildHeatmapModel(targets: readonly MuscleEmphasis[]): HeatmapModel {
  const strongestByRegion = new Map<MuscleRegionId, number>();

  for (const target of targets) {
    const region = normalizeMuscleName(target.muscle);
    if (!region || target.percent <= 0) continue;
    strongestByRegion.set(region, Math.max(strongestByRegion.get(region) ?? 0, target.percent));
  }

  const regions: ActiveHeatmapRegion[] = [...strongestByRegion].map(([id, percent]) => ({
    id,
    percent,
    mix: heatMixForPercent(percent),
    fill: heatFillForPercent(percent),
  }));
  const activeRegionIds = new Set(regions.map((region) => region.id));
  const views = HEATMAP_VIEW_ORDER.filter((view) =>
    [...activeRegionIds].some((region) => BODY_HEATMAP_REGIONS[region][view]?.length),
  );
  const accessibleSummary =
    targets.length === 0
      ? 'No muscle emphasis data.'
      : `Muscle emphasis: ${targets
          .map((target) => `${target.muscle} ${target.percent} percent`)
          .join(', ')}.`;

  return { views, regions, accessibleSummary };
}
