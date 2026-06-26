import type { PublicInfringement } from "@/contracts/public-api";

/** NZ locale number formatter for counts and ranks. */
export const numberFmt = new Intl.NumberFormat("en-NZ");

/** NZ locale currency formatter (whole dollars). */
export const moneyFmt = new Intl.NumberFormat("en-NZ", {
  currency: "NZD",
  maximumFractionDigits: 0,
  style: "currency",
});

/** Display label for a vehicle from infringement fields. */
export const formatVehicle = (record: PublicInfringement): string => {
  const parts = [record.vehicleMake, record.vehicleModel].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return record.vehicleType ?? "Unknown vehicle";
};

/** Street line with optional suburb suffix. */
export const formatStreetSuburb = (
  street: string,
  suburb: string | undefined
): string => {
  if (suburb !== undefined && suburb.length > 0 && suburb !== "Unknown") {
    return `${street}, ${suburb}`;
  }
  return street;
};

/** Subtitle for location rows; omits empty or unknown suburbs. */
export const formatLocationSubtitle = (
  suburb: string | undefined
): string | undefined => {
  if (suburb !== undefined && suburb.length > 0 && suburb !== "Unknown") {
    return suburb;
  }
  return undefined;
};
