import type { GeoJsonProperties, Geometry, Point } from "geojson";
import type MapLibreGL from "maplibre-gl";

import type { MapGeoJSONFeature } from "@/components/ui/map-types";

export const mergeHoverPaint = (
  paint: Record<string, unknown>,
  hoverPaint: Record<string, unknown> | undefined
): Record<string, unknown> => {
  if (hoverPaint === undefined) {
    return paint;
  }
  const merged: Record<string, unknown> = { ...paint };
  for (const [key, hoverValue] of Object.entries(hoverPaint)) {
    if (hoverValue === undefined) {
      continue;
    }
    const baseValue = merged[key];
    merged[key] =
      baseValue === undefined
        ? hoverValue
        : [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            hoverValue,
            baseValue,
          ];
  }
  return merged;
};

const isGeoJSONSource = (
  source: MapLibreGL.Source
): source is MapLibreGL.GeoJSONSource => source.type === "geojson";

export const getGeoJSONSource = (
  map: MapLibreGL.Map,
  sourceId: string
): MapLibreGL.GeoJSONSource | undefined => {
  const source = map.getSource(sourceId);
  if (source === undefined || !isGeoJSONSource(source)) {
    return undefined;
  }
  return source;
};

export const toMapGeoJSONFeature = (
  feature: MapLibreGL.MapGeoJSONFeature
): MapGeoJSONFeature => ({
  geometry: feature.geometry,
  id: feature.id,
  layer: feature.layer,
  properties: feature.properties,
  source: feature.source,
  state: feature.state,
  type: feature.type,
});

export const syncPaintProperties = (
  map: MapLibreGL.Map,
  layerId: string,
  paint: Record<string, unknown>
): void => {
  for (const [key, value] of Object.entries(paint)) {
    map.setPaintProperty(layerId, key, value);
  }
};

export const syncLayoutProperties = (
  map: MapLibreGL.Map,
  layerId: string,
  layout: Record<string, unknown>
): void => {
  for (const [key, value] of Object.entries(layout)) {
    map.setLayoutProperty(layerId, key, value);
  }
};

const isPointGeometry = (geometry: Geometry): geometry is Point =>
  geometry.type === "Point";

export const getPointCoordinates = (
  geometry: Geometry
): [number, number] | undefined => {
  if (!isPointGeometry(geometry)) {
    return undefined;
  }
  const [lng, lat] = geometry.coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") {
    return undefined;
  }
  return [lng, lat];
};

export const readNumberProperty = (
  properties: GeoJsonProperties,
  key: string
): number | undefined => {
  if (properties === null) {
    return undefined;
  }
  const value: unknown = properties[key];
  return typeof value === "number" ? value : undefined;
};

export const DEFAULT_ARC_CURVATURE = 0.2;
export const DEFAULT_ARC_SAMPLES = 64;
const ARC_HIT_MIN_WIDTH = 12;
const ARC_HIT_PADDING = 6;

export const DEFAULT_ARC_PAINT: NonNullable<
  MapLibreGL.LineLayerSpecification["paint"]
> = {
  "line-color": "#4285F4",
  "line-opacity": 0.85,
  "line-width": 2,
};

export const DEFAULT_ARC_LAYOUT: NonNullable<
  MapLibreGL.LineLayerSpecification["layout"]
> = {
  "line-cap": "round",
  "line-join": "round",
};

export const computeArcHitWidth = (
  paint?: NonNullable<MapLibreGL.LineLayerSpecification["paint"]>
): number => {
  const w = paint?.["line-width"] ?? DEFAULT_ARC_PAINT["line-width"];
  const base = typeof w === "number" ? w : ARC_HIT_MIN_WIDTH;
  return Math.max(base + ARC_HIT_PADDING, ARC_HIT_MIN_WIDTH);
};

export const buildArcCoordinates = (
  from: [number, number],
  to: [number, number],
  curvature: number,
  samples: number
): [number, number][] => {
  const [x0, y0] = from;
  const [xTo, y2] = to;
  const rawDx = xTo - x0;
  let x2 = xTo;
  if (rawDx > 180) {
    x2 = xTo - 360;
  } else if (rawDx < -180) {
    x2 = xTo + 360;
  }
  const dx = x2 - x0;
  const dy = y2 - y0;
  const distance = Math.hypot(dx, dy);

  if (distance === 0 || curvature === 0) {
    return [from, [x2, y2]];
  }

  const mx = (x0 + x2) / 2;
  const my = (y0 + y2) / 2;
  const nx = -dy / distance;
  const ny = dx / distance;
  const offset = distance * curvature;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;

  const points: [number, number][] = [];
  const segments = Math.max(2, Math.floor(samples));
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const inv = 1 - t;
    const x = inv * inv * x0 + 2 * inv * t * cx + t * t * x2;
    const y = inv * inv * y0 + 2 * inv * t * cy + t * t * y2;
    points.push([x, y]);
  }
  return points;
};

export const DEFAULT_CLUSTER_COLORS: [string, string, string] = [
  "#22c55e",
  "#eab308",
  "#ef4444",
];

export const DEFAULT_CLUSTER_THRESHOLDS: [number, number] = [100, 750];

export const GEOJSON_DEFAULT_COLORS = {
  dark: { fill: "#404040", line: "#0a0a0a" },
  light: { fill: "#d4d4d4", line: "#fafafa" },
} satisfies Record<"light" | "dark", { fill: string; line: string }>;
