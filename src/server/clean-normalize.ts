import { localDateTimeInAucklandIso } from "@/lib/auckland-time.ts";
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

export const dollarsToCents = (amount: number): number =>
  Math.round(amount * 100);

export const toIsoOccurredAt = localDateTimeInAucklandIso;

export const emptyToNull = (value: string): string | null =>
  value.length > 0 ? value : null;

export const normalizeStreet = (raw: string): string => {
  const collapsed = raw.trim().replaceAll(/\s+/gu, " ");
  if (collapsed === "") {
    return "Unknown";
  }
  return titleCaseWords(collapsed);
};

export const normalizeSuburb = (raw: string): string | null => {
  const value = titleCaseWords(raw.trim());
  return value.length > 0 ? value : null;
};

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

export const normalizeVehicleModel = (raw: string): string | null =>
  raw === "" ? null : titleCaseWords(raw);
