import type { RawInfringementRecord } from "@/server/clean-schema.ts";
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

/**
 *  Parse a single CSV line respecting quoted fields and commas.
 * @param line - Line supplied to this operation.
 * @returns The resulting `string[]` value.
 */
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
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }

  cells.push(cell);

  return cells;
};

/**
 * Map CSV header + value cells to a raw infringement object
 * suitable for `POST /api/v1/import/infringements`.
 * @param headers - Headers supplied to this operation.
 * @param values - Values supplied to this operation.
 * @returns The resulting `RawInfringementRecord` value.
 */
export const toRawInfringementRecord = (
  headers: string[],
  values: string[]
): RawInfringementRecord => {
  const record: RawInfringementRecord = {};

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
    } else if (booleanFields.has(key)) {
      record[key] = raw === "1" || raw.toLowerCase() === "true";
    } else {
      record[key] =
        key === "Infringement_Date" || key === "Infringement_Closed_Date"
          ? normalizeDate(raw)
          : raw;
    }
  }

  return record;
};
