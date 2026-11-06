import { resolveOffenceDescription } from "@/lib/offence-catalog.ts";

const STREET_SUFFIXES: Record<string, string> = {
  AVE: "Ave",
  CRES: "Cres",
  CT: "Ct",
  DR: "Dr",
  LN: "Ln",
  PL: "Pl",
  RD: "Rd",
  ST: "St",
  TCE: "Tce",
};

const titleCaseWords = (value: string): string =>
  value
    .split(/\s+/u)
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/u.test(word)) {
        return word;
      }

      const upper = word.toUpperCase();

      if (STREET_SUFFIXES[upper] !== undefined) {
        return STREET_SUFFIXES[upper];
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

/**
 * Converts a dollar amount to the nearest whole cent.
 * @param amount - The amount in dollars.
 * @returns The rounded amount in cents.
 */
export const dollarsToCents = (amount: number): number =>
  Math.round(amount * 100);

export { localDateTimeInAucklandIso as toIsoOccurredAt } from "@/lib/auckland-time.ts";

/**
 * Converts an empty string to null without trimming other values.
 * @param value - The string to inspect.
 * @returns The original string, or null when it is empty.
 */
export const emptyToNull = (value: string): string | null =>
  value.length > 0 ? value : null;

/**
 * Normalizes street whitespace and capitalization.
 * @param raw - The source street name.
 * @returns The normalized name, or `Unknown` when it is empty.
 */
export const normalizeStreet = (raw: string): string => {
  const collapsed = raw.trim().replaceAll(/\s+/gu, " ");

  if (collapsed === "") {
    return "Unknown";
  }

  return titleCaseWords(collapsed);
};

/**
 * Normalizes suburb capitalization and whitespace.
 * @param raw - The source suburb name.
 * @returns The normalized name, or null when it is empty.
 */
export const normalizeSuburb = (raw: string): string | null => {
  const value = titleCaseWords(raw.trim());

  return value.length > 0 ? value : null;
};

/**
 * Normalizes a vehicle make while preserving short uppercase abbreviations.
 * @param raw - The source make.
 * @returns The normalized make, or null when it is empty.
 */
export const normalizeVehicleMake = (raw: string): string | null => {
  const value = raw.trim();

  if (value === "") {
    return null;
  }

  if (value.length <= 4 && value === value.toUpperCase()) {
    return value.toUpperCase();
  }

  return titleCaseWords(value);
};

const sentenceCase = (value: string): string => {
  const lower = value.toLowerCase().trim();

  if (lower === "") {
    return "";
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/**
 * Resolves an offence code and display label from the source fields.
 * @param description - The source description, which may include a code prefix.
 * @param offenceCode - The separate source offence code.
 * @returns The resolved code and description label.
 */
export const normalizeOffence = (
  description: string,
  offenceCode: string
): { code: string; label: string } => {
  const trimmed = description.trim();

  const prefixMatch = /^(?<code>[A-Z]\d{2,4})\s+(?<description>.+)$/iu.exec(
    trimmed
  );

  if (prefixMatch?.groups !== undefined) {
    const code = prefixMatch.groups.code.toUpperCase();
    const label = sentenceCase(prefixMatch.groups.description.trim());

    return {
      code,
      label: resolveOffenceDescription(code, label),
    };
  }

  const code = offenceCode.trim() === "" ? "unknown" : offenceCode.trim();
  const label = trimmed === "" ? "Unknown offence" : sentenceCase(trimmed);

  return {
    code,
    label: resolveOffenceDescription(code, label),
  };
};

/**
 * Normalizes a court service method and expands the posted code.
 * @param raw - The source service method.
 * @returns The normalized method, or null when it is empty.
 */
export const normalizeCourtServeMethod = (raw: string): string | null => {
  const value = raw.trim().toUpperCase();

  if (value === "") {
    return null;
  }

  const labels: Record<string, string> = {
    P: "Posted",
  };

  return labels[value] ?? value;
};

/**
 * Normalizes a vehicle type, including the abbreviated motor-vehicle label.
 * @param raw - The source vehicle type.
 * @returns The normalized type, or null when it is empty.
 */
export const normalizeVehicleType = (raw: string): string | null => {
  const value = raw.trim();

  if (value === "") {
    return null;
  }

  if (value.toUpperCase() === "MOTOR VEHI") {
    return "Motor vehicle";
  }

  return titleCaseWords(value);
};

/**
 * Normalizes vehicle model capitalization.
 * @param raw - The source model.
 * @returns The normalized model, or null when the source string is empty.
 */
export const normalizeVehicleModel = (raw: string): string | null =>
  raw === "" ? null : titleCaseWords(raw);
