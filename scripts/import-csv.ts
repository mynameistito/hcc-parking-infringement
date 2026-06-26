/**
 * Import a Hamilton parking infringement CSV into ParkingStore.
 *
 * @example
 * bun run import:csv
 * bun run import:csv -- --file=data/Infringement.csv --batch-size=500
 */

import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

import { loadDevVars } from "@scripts/dev-env.ts";
import { readArg, scriptArgv } from "@scripts/lib/args.ts";
import { parseCsvLine, toRawInfringementRecord } from "@scripts/lib/csv.ts";
import { createWorkerContext } from "@scripts/lib/worker-client.ts";
import { z } from "zod";

import { parseNonNegativeInt, parsePositiveInt } from "@/server/http/query.ts";

loadDevVars();

const args = scriptArgv();
const { apiKey, workerUrl } = createWorkerContext();
const csvPath = readArg(args, "file") ?? "data\\Infringement.csv";
const batchSize = Math.min(
  parsePositiveInt(readArg(args, "batch-size"), 1000),
  5000
);
const skipRows = parseNonNegativeInt(readArg(args, "skip-rows"), 0);

const importResponseSchema = z.object({
  final: z.boolean(),
  ok: z.boolean(),
  recomputed: z.boolean(),
  recordsReceived: z.number(),
  recordsUpserted: z.number(),
  skipped: z.number(),
  totalRecords: z.number(),
});

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

for (const line of dataLines) {
  lineNumber += 1;
  seenRows += 1;

  if (seenRows > skipRows) {
    batch.push(toRawInfringementRecord(headers, parseCsvLine(line)));

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
}

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
