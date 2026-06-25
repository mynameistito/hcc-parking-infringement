import type { MapRouteItem } from "../client/api";
import { heatColor, heatLineOpacity, heatLineWeight } from "./map-heat";

export interface RouteFeatureProperties {
  id: string;
  street: string;
  suburb: string | null;
  town: string;
  count: number;
  color: string;
  width: number;
  opacity: number;
}

export const isRealRoadLine = (line: [number, number][]): boolean =>
  line.length >= 3;

export const filterRoadGeometry = (
  geometry: [number, number][][]
): [number, number][][] => geometry.filter(isRealRoadLine);

export const buildRoutesGeoJSON = (
  routes: MapRouteItem[],
  maxCount: number
): GeoJSON.FeatureCollection<GeoJSON.LineString, RouteFeatureProperties> => {
  const features: GeoJSON.Feature<
    GeoJSON.LineString,
    RouteFeatureProperties
  >[] = [];

  for (const route of routes) {
    const ratio = route.count / maxCount;
    const color = heatColor(ratio);
    const width = heatLineWeight(ratio);
    const opacity = heatLineOpacity(ratio);

    for (const [segmentIndex, line] of route.geometry.entries()) {
      if (!isRealRoadLine(line)) {
        continue;
      }

      features.push({
        geometry: {
          coordinates: line.map(([lat, lon]) => [lon, lat]),
          type: "LineString",
        },
        id: `${route.id}-${segmentIndex}`,
        properties: {
          color,
          count: route.count,
          id: `${route.id}-${segmentIndex}`,
          opacity,
          street: route.street,
          suburb: route.suburb,
          town: route.town,
          width,
        },
        type: "Feature",
      });
    }
  }

  return { features, type: "FeatureCollection" };
};

export const hamiltonMapCenter = (): [number, number] => [175.2793, -37.787];

export const boundsFromRoutes = (
  routes: MapRouteItem[]
): [[number, number], [number, number]] | null => {
  let minLon = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const route of routes) {
    for (const line of route.geometry) {
      for (const [lat, lon] of line) {
        minLon = Math.min(minLon, lon);
        minLat = Math.min(minLat, lat);
        maxLon = Math.max(maxLon, lon);
        maxLat = Math.max(maxLat, lat);
      }
    }
  }

  if (!Number.isFinite(minLon)) {
    return null;
  }

  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ];
};
