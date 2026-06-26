export interface PublicTopItem {
  label: string;
  count: number;
}

export interface LocationRankItem {
  street?: string;
  suburb?: string;
  label: string;
  count: number;
}

export interface VehicleRankItem {
  make: string;
  model: string;
  label: string;
  count: number;
}

export type BrowseSort = "count" | "name";

export interface BrowseQuery {
  q?: string;
  page: number;
  limit: number;
  sort: BrowseSort;
  suburb?: string;
}

export interface BrowseResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}
