import { z } from "zod";

import type { ImportBatchResult } from "../durable-objects/parking-store.ts";
import { cleanInfringements } from "./clean.ts";
import { getParkingStore } from "./store.ts";

const importBatchSchema = z.object({
  final: z.boolean().optional().default(false),
  records: z.array(z.record(z.string(), z.unknown())).max(5000),
});

export interface ImportInfringementsResult extends ImportBatchResult {
  final: boolean;
}

export const importInfringements = async (
  env: Env,
  body: unknown
): Promise<ImportInfringementsResult> => {
  const payload = importBatchSchema.parse(body);
  const { cleaned, skipped } = cleanInfringements(payload.records);
  const result = await getParkingStore(env).importInfringementBatch({
    final: payload.final,
    records: cleaned,
    recordsReceived: payload.records.length,
    skipped,
  });

  return {
    ...result,
    final: payload.final,
  };
};
