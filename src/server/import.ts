import { z } from "zod";

import type { ImportBatchResult } from "@/durable-objects/types.ts";
import type { AppScope } from "@/server/app-scope.ts";
import { cleanInfringements } from "@/server/clean.ts";
import { assertParkingStoreWritable } from "@/server/parking-writes.ts";
import { getParkingStore } from "@/server/store.ts";

/** Parse the administration import body before it enters the import service. */
export const importBatchSchema = z.object({
  final: z.boolean().optional().default(false),
  records: z.array(z.record(z.string(), z.unknown())).max(5000),
});

/**
 * Imported batch counts and finalization state.
 */
export interface ImportInfringementsResult extends ImportBatchResult {
  final: boolean;
}

/**
 * Parse and store an infringement import batch.
 * @param scope - Request services and storage mode.
 * @param payload - Parsed infringement import command.
 * @returns The resulting `Promise<ImportInfringementsResult>` value.
 */
export const importInfringements = async (
  scope: AppScope,
  payload: z.output<typeof importBatchSchema>
): Promise<ImportInfringementsResult> => {
  assertParkingStoreWritable(scope);
  const { cleaned, skipped } = cleanInfringements(payload.records);

  const result = await getParkingStore(scope.env).importInfringementBatch({
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
