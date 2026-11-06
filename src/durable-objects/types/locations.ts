/** A ranked location and its coordinate lines for map display. */
export interface LocationMapPoint {
  id: string;
  street: string;
  suburb: string | null;
  town: string;
  count: number;
  geometry: [number, number][][];
}

/** A geocoded location and geometry to persist in the location cache. */
export interface LocationCacheInput {
  street: string;
  suburb: string | null;
  town: string;
  lat: number;
  lon: number;
  displayName: string;
  geometry: [number, number][][];
}
