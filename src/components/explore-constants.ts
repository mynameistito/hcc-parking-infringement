export const EXPLORE_PAGE_SIZE = 25;

export type ExploreTab = "suburbs" | "streets" | "vehicles";

export interface TicketFilter {
  street?: string;
  suburb?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export const isExploreTab = (value: string): value is ExploreTab =>
  value === "suburbs" || value === "streets" || value === "vehicles";

export const optionalSearchQuery = (search: string): string | undefined =>
  search.length > 0 ? search : undefined;
