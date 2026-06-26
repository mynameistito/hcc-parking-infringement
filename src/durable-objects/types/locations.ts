export interface LocationMapPoint {
  id: string;
  street: string;
  suburb: string | null;
  town: string;
  count: number;
  geometry: [number, number][][];
}

export interface LocationCacheInput {
  street: string;
  suburb: string | null;
  town: string;
  lat: number;
  lon: number;
  displayName: string;
  geometry: [number, number][][];
}
