/**
 * Import a Hamilton parking infringement CSV into ParkingStore.
 *
 * Usage:
 *   bun run import:csv
 *   bun run import:csv -- --file=C:\path\Infringement.csv
 *   API_KEY=xxx WORKER_URL=https://your-worker.workers.dev bun run import:csv
 */

import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

import { getWorkerUrl, loadDevVars } from "@scripts/dev-env.ts";
import { z } from "zod";

loadDevVars();

const args = process.argv.slice(2);

const readArg = (name: string): string | undefined => {
  const prefix = `--${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const parsePositiveInt = (
  value: string | undefined,
  fallback: number
): number => {
  if (value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const workerUrl = getWorkerUrl();
const apiKey = process.env.API_KEY;
const csvPath = readArg("file") ?? "data\\Infringement.csv";
const batchSize = Math.min(parsePositiveInt(readArg("batch-size"), 1000), 5000);
const skipRows = Math.max(Number.parseInt(readArg("skip-rows") ?? "0", 10), 0);

if (apiKey === undefined || apiKey === "") {
  console.error("Missing API_KEY. Set it in the environment or .dev.vars.");
  console.error('  PowerShell: $env:API_KEY = "your-key"');
  process.exit(1);
}

const importResponseSchema = z.object({
  final: z.boolean(),
  ok: z.boolean(),
  recomputed: z.boolean(),
  recordsReceived: z.number(),
  recordsUpserted: z.number(),
  skipped: z.number(),
  totalRecords: z.number(),
});

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

const parseCsvLine = (line: string): string[] => {
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

const toRawRecord = (
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

const postBatchOnce = async (
  records: Record<string, unknown>[],
  final: boolean,
  retry: () => Promise<z.infer<typeof importResponseSchema> | null>
) => {
  const response = await fetch(`${workerUrl}/api/v1/import/infringements`, {
    body: JSON.stringify({ final, records }),
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const rawBody: unknown = await response.json().catch(() => null);
  const parsedBody = importResponseSchema.safeParse(rawBody);

  if (!response.ok || !parsedBody.success) {
    if (response.status === 429 || response.status >= 500) {
      const retried = await retry();
      if (retried !== null) {
        return retried;
      }
    }
    console.error(`Import failed (${response.status}):`, rawBody);
    process.exit(1);
  }

  return parsedBody.data;
};

const postBatch = async (
  records: Record<string, unknown>[],
  final: boolean,
  attempt = 1
) => {
  const maxAttempts = 4;
  const retryDelayMs = attempt * 1500;

  const retry = async () => {
    if (attempt >= maxAttempts) {
      return null;
    }
    await delay(retryDelayMs);
    return await postBatch(records, final, attempt + 1);
  };

  return await postBatchOnce(records, final, retry);
};

const text = await readFile(csvPath, "utf-8");
const lines = text.split(/\r?\n/u);
const headerLine = lines.find((line) => line.length > 0);

if (headerLine === undefined) {
  console.error(`CSV has no header: ${csvPath}`);
  process.exit(1);
}

const headers = parseCsvLine(headerLine);
const batch: Record<string, unknown>[] = [];
let importedRows = 0;
let upsertedRows = 0;
let skippedRows = 0;
let lineNumber = 1;
let seenRows = 0;

const dataLines = lines.slice(1).filter((line) => line.length > 0);

const uploadFullBatch = async (final: boolean) => {
  const records = batch.splice(0);
  return await postBatch(records, final);
};

const processDataLine = async (index: number): Promise<void> => {
  if (index >= dataLines.length) {
    return;
  }

  const line = dataLines[index];
  if (line === undefined) {
    await processDataLine(index + 1);
    return;
  }

  lineNumber += 1;
  seenRows += 1;

  if (seenRows > skipRows) {
    batch.push(toRawRecord(headers, parseCsvLine(line)));

    if (batch.length >= batchSize) {
      const result = await uploadFullBatch(false);
      importedRows += result.recordsReceived;
      upsertedRows += result.recordsUpserted;
      skippedRows += result.skipped;
      console.log(
        `Imported ${importedRows.toLocaleString()} rows, total in DO ${result.totalRecords.toLocaleString()}`
      );
    }
  }

  await processDataLine(index + 1);
};

await processDataLine(0);
const finalResult = await uploadFullBatch(true);
importedRows += finalResult.recordsReceived;
upsertedRows += finalResult.recordsUpserted;
skippedRows += finalResult.skipped;

console.log("CSV import complete:", {
  importedRows,
  lineNumber,
  skippedRows,
  totalRecords: finalResult.totalRecords,
  upsertedRows,
});
