/**
 * Full offence labels keyed by the P/C code embedded in HCC Offence_Description.
 * The council API pads and truncates that field (~40 chars), so stored text is often
 * incomplete (e.g. P546 → "Failed to correctly activate the").
 */
export const OFFENCE_DESCRIPTION_BY_CODE: Readonly<Record<string, string>> = {
  C101: "No evidence of current WOF",
  P106: "Parked over the time limit",
  P107: "Parked on broken yellow lines",
  P110: "Parked obstructing vehicle entrance",
  P114: "Incorrect kerb parking",
  P119: "Parked on a loading zone – vehicle not of class specified on the sign",
  P350: "Parked on lawn, garden or verge",
  P401: "Operated unregistered motor vehicle",
  P402: "Operated unlicensed motor vehicle",
  P410: "Exemption from licensing",
  P508: "Parked in a clearway",
  P542: "Parked in metered parking place without paying applicable fee",
  P546: "Failed to correctly activate the parking machine",
  P969: "Parked in an area reserved for disabled persons",
};

/** HCC Offence_Code values observed in the open-data feed → marker code in description. */
const HCC_OFFENCE_CODE_TO_MARKER: Readonly<Record<string, string>> = {
  "101": "C101",
  "151": "P106",
  "160": "P107",
  "163": "P110",
  "166": "P114",
  "170": "P119",
  "210": "P350",
  "211": "P969",
  "296": "P401",
  "297": "P402",
  "305": "P410",
  "500": "P508",
  "823": "P542",
  "824": "P546",
};

const OFFENCE_MARKER_PREFIX_RE =
  /^(?<code>[PC]\d{2,4}[A-F]?)\s+(?<description>.+)$/iu;

export const sanitizeOffenceText = (value: string): string =>
  value.replaceAll(/\s+/gu, " ").trim();

const normalizeForCompare = (value: string): string =>
  sanitizeOffenceText(value)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, " ")
    .trim();

const isTruncatedLabel = (stored: string, full: string): boolean => {
  const normalizedStored = normalizeForCompare(stored);
  const normalizedFull = normalizeForCompare(full);

  if (normalizedStored.length === 0) {
    return true;
  }

  return (
    normalizedFull.startsWith(normalizedStored) &&
    normalizedFull.length > normalizedStored.length
  );
};

const extractMarkerCode = (description: string): string | undefined => {
  const match = OFFENCE_MARKER_PREFIX_RE.exec(sanitizeOffenceText(description));
  return match?.groups?.code?.toUpperCase();
};

const stripMarkerPrefix = (description: string): string => {
  const sanitized = sanitizeOffenceText(description);
  const withoutPrefix = sanitized.replace(/^[PC]\d{2,4}[A-F]?\s+/iu, "");
  return withoutPrefix.length > 0 ? withoutPrefix : sanitized;
};

const markerCodeFromCouncilCode = (
  code: string | null | undefined
): string | undefined => {
  const normalized = code?.trim() ?? "";
  if (normalized.length === 0) {
    return undefined;
  }

  const upper = normalized.toUpperCase();
  if (OFFENCE_DESCRIPTION_BY_CODE[upper] !== undefined) {
    return upper;
  }

  return HCC_OFFENCE_CODE_TO_MARKER[normalized];
};

const findCatalogByStoredPrefix = (description: string): string | undefined => {
  const normalized = normalizeForCompare(description);
  if (normalized.length === 0) {
    return undefined;
  }

  let best: string | undefined;
  let bestLength = 0;

  for (const label of Object.values(OFFENCE_DESCRIPTION_BY_CODE)) {
    const normalizedLabel = normalizeForCompare(label);
    if (
      normalizedLabel.startsWith(normalized) &&
      normalizedLabel.length > normalized.length &&
      normalizedLabel.length > bestLength
    ) {
      best = label;
      bestLength = normalizedLabel.length;
    }
  }

  return best;
};

const resolveFromCodes = (
  codes: Iterable<string | undefined>,
  description: string
): string | undefined => {
  for (const code of codes) {
    if (code === undefined) {
      continue;
    }

    const catalog = OFFENCE_DESCRIPTION_BY_CODE[code];
    if (catalog === undefined) {
      continue;
    }

    if (description === "" || isTruncatedLabel(description, catalog)) {
      return catalog;
    }
  }

  return undefined;
};

/** Prefer the catalog label when the council feed truncated or abbreviated it. */
export const resolveOffenceDescription = (
  code: string | null | undefined,
  description: string
): string => {
  const sanitized = sanitizeOffenceText(description);
  const markerFromDescription = extractMarkerCode(sanitized);
  const descriptionBody =
    markerFromDescription === undefined
      ? sanitized
      : stripMarkerPrefix(sanitized);

  const resolvedFromCodes = resolveFromCodes(
    [
      markerFromDescription,
      markerCodeFromCouncilCode(code),
      code?.trim().toUpperCase(),
    ],
    descriptionBody
  );

  if (resolvedFromCodes !== undefined) {
    return resolvedFromCodes;
  }

  const resolvedFromPrefix = findCatalogByStoredPrefix(descriptionBody);
  if (resolvedFromPrefix !== undefined) {
    return resolvedFromPrefix;
  }

  return descriptionBody;
};
