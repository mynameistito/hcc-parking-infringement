import type { GeoJsonProperties, Geometry } from "geojson";
import type MapLibreGL from "maplibre-gl";

/** A rendered feature with strongly-typed `properties`. */
export interface MapGeoJSONFeature {
  geometry: Geometry;
  id?: string | number;
  layer: MapLibreGL.MapGeoJSONFeature["layer"];
  properties: GeoJsonProperties;
  source: string;
  state: Record<string, unknown>;
  type: "Feature";
}

/** Event payload passed to MapGeoJSON interaction callbacks. */
export interface MapGeoJSONEvent {
  feature: MapGeoJSONFeature;
  longitude: number;
  latitude: number;
  originalEvent: MapLibreGL.MapLayerMouseEvent;
}

/** A single arc to render inside `<MapArc data={...}>`. */
export interface MapArcDatum {
  id: string | number;
  from: [number, number];
  to: [number, number];
}

/** Event payload passed to MapArc interaction callbacks. */
export interface MapArcEvent<T extends MapArcDatum = MapArcDatum> {
  arc: T;
  longitude: number;
  latitude: number;
  originalEvent: MapLibreGL.MapMouseEvent;
}
