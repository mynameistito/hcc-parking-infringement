/** Parse Hamilton infringement CSV rows into raw HCC-shaped records. */

const numberFields = new Set([
  "Additional_Costs_Amount",
  "Additional_Costs_Balance",
  "Infringement_Amount",
  "Infringement_Number",
  "Infringement_Type",
]);

const booleanFields = new Set(["Is_Towed"]);

const normalizeDate = (value: string): string => {
  const trimmed = value.trim();
  if (/^\d{4}\/\d{2}\/\d{2}$/u.test(trimmed)) {
    return trimmed.replaceAll("/", "-");
  }
  return trimmed;
};

/** Parse a single CSV line respecting quoted fields and commas. */
export const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
      continue;
    }

    cell += char;
  }

  cells.push(cell);
  return cells;
};

/**
 * Map CSV header + value cells to a raw infringement object
 * suitable for `POST /api/v1/import/infringements`.
 */
export const toRawInfringementRecord = (
  headers: string[],
  values: string[]
): Record<string, unknown> => {
  const record: Record<string, unknown> = {};

  for (let index = 0; index < headers.length; index += 1) {
    const key = headers[index];
    if (
      key === undefined ||
      key === "" ||
      key === "FID" ||
      key === "hash_binary"
    ) {
      continue;
    }

    const raw = values[index]?.trim() ?? "";

    if (numberFields.has(key)) {
      if (raw !== "") {
        record[key] = Number(raw);
      }
      continue;
    }

    if (booleanFields.has(key)) {
      record[key] = raw === "1" || raw.toLowerCase() === "true";
      continue;
    }

    record[key] =
      key === "Infringement_Date" || key === "Infringement_Closed_Date"
        ? normalizeDate(raw)
        : raw;
  }

  return record;
};
