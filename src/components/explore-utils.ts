import type { PublicInfringement } from "../client/api";

export const EXPLORE_PAGE_SIZE = 25;

export const numberFmt = new Intl.NumberFormat("en-NZ");
export const moneyFmt = new Intl.NumberFormat("en-NZ", {
  currency: "NZD",
  maximumFractionDigits: 0,
  style: "currency",
});

export type ExploreTab = "suburbs" | "streets" | "vehicles";

export interface TicketFilter {
  street?: string;
  suburb?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export const formatVehicle = (record: PublicInfringement): string => {
  const parts = [record.vehicleMake, record.vehicleModel].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return record.vehicleType ?? "Unknown vehicle";
};

export const isExploreTab = (value: string): value is ExploreTab =>
  value === "suburbs" || value === "streets" || value === "vehicles";

export const optionalSearchQuery = (search: string): string | undefined =>
  search.length > 0 ? search : undefined;

export const formatStreetSuburb = (
  street: string,
  suburb: string | undefined
): string => {
  if (suburb !== undefined && suburb.length > 0 && suburb !== "Unknown") {
    return `${street}, ${suburb}`;
  }
  return street;
};

export const formatLocationSubtitle = (
  suburb: string | undefined
): string | undefined => {
  if (suburb !== undefined && suburb.length > 0 && suburb !== "Unknown") {
    return suburb;
  }
  return undefined;
};
