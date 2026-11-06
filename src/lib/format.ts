import type { PublicInfringement } from "@/contracts/public-api";
import { formatAucklandInstant } from "@/lib/auckland-time";

/** NZ locale number formatter for counts and ranks. */
export const numberFmt = new Intl.NumberFormat("en-NZ");

/** NZ locale currency formatter (whole dollars). */
export const moneyFmt = new Intl.NumberFormat("en-NZ", {
  currency: "NZD",
  maximumFractionDigits: 0,
  style: "currency",
});

/**
 * Builds a display label from an infringement's vehicle fields.
 * @param record - The public infringement record.
 * @returns The make and model, vehicle type, or an unknown-vehicle label.
 */
export const formatVehicle = (record: PublicInfringement): string => {
  const parts = [record.vehicleMake, record.vehicleModel].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return record.vehicleType ?? "Unknown vehicle";
};

/**
 * Formats an occurrence instant as a compact Pacific/Auckland date and time.
 * @param occurredAt - An Auckland instant with a numeric offset.
 * @returns The formatted occurrence date and time.
 */
export const formatOccurrenceInstantShort = (occurredAt: string): string =>
  formatAucklandInstant(occurredAt, "d MMM yy, h:mm a");

/**
 * Combines a street with an available suburb name.
 * @param street - The street name.
 * @param suburb - The suburb name, if known.
 * @returns A street label with an optional suburb suffix.
 */
export const formatStreetSuburb = (
  street: string,
  suburb: string | undefined
): string => {
  if (suburb !== undefined && suburb.length > 0 && suburb !== "Unknown") {
    return `${street}, ${suburb}`;
  }

  return street;
};
