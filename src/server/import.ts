import { z } from "zod";

import type { ImportBatchResult } from "@/durable-objects/types.ts";
import { cleanInfringements } from "@/server/clean.ts";
import { getParkingStore } from "@/server/store.ts";

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
