/** Public ranking label and infringement count. */
export interface PublicTopItem {
  label: string;
  count: number;
}

/** Ranked location with optional street and suburb identifiers. */
export interface LocationRankItem {
  street?: string;
  suburb?: string;
  label: string;
  count: number;
}

/** Ranked vehicle make and model with its display label and count. */
export interface VehicleRankItem {
  make: string;
  model: string;
  label: string;
  count: number;
}

/** Supported browse ranking orders. */
export type BrowseSort = "count" | "name";

/** Search, sorting, and pagination options for a browse request. */
export interface BrowseQuery {
  q?: string;
  page: number;
  limit: number;
  sort: BrowseSort;
  suburb?: string;
}

/**
 * A page of browse results and its total matching count.
 * @typeParam T - The item type in the returned page.
 */
export interface BrowseResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}
