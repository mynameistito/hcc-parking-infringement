import { z } from "zod";

import type {
  ExportInfringementsResult,
  ExportTotalMode,
  ExportWatermarksResult,
} from "@/durable-objects/parking-store/replication.ts";
import type { AppScope } from "@/server/app-scope.ts";
import { cleanInfringementSchema } from "@/server/clean-schema.ts";
import { assertParkingStoreWritable } from "@/server/parking-writes.ts";
import { getParkingStore } from "@/server/store.ts";

const importStoredBatchSchema = z.object({
  final: z.boolean().optional().default(false),
  records: z.array(cleanInfringementSchema).max(5000),
});

const importWatermarksSchema = z.object({
  watermarks: z
    .array(
      z.object({
        end: z.string(),
        ingestedAt: z.string(),
        recordCount: z.number(),
        start: z.string(),
      })
    )
    .max(5000),
});

const importSnapshotBatchSchema = z.object({
  infringements: z.array(cleanInfringementSchema).max(5000),
});

/**
 * Exports a page of stored infringements.
 * @param scope - Application scope and parking reader.
 * @param after - Cursor after the last exported infringement.
 * @param limit - Maximum records to return.
 * @param totalMode - Whether to read a cached total or scan storage.
 * @returns The exported records, total, and next cursor.
 */
export const exportStoredInfringements = async (
  scope: AppScope,
  after: number,
  limit: number,
  totalMode: ExportTotalMode = "cached"
): Promise<ExportInfringementsResult> =>
  await scope.parking.exportInfringements(after, limit, totalMode);

/**
 * Validates and imports a batch of stored infringements.
 * @param scope - Application scope and writable parking store.
 * @param body - Untrusted request payload containing the records.
 * @returns Import counts and finalization status.
 */
export const importStoredInfringements = async (
  scope: AppScope,
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- The request body is untrusted and validated by the import schema.
  body: unknown
): Promise<{
  final: boolean;
  recordsReceived: number;
  recordsUpserted: number;
  recomputed: boolean;
  totalRecords?: number;
}> => {
  assertParkingStoreWritable(scope);
  const payload = importStoredBatchSchema.parse(body);
  const store = getParkingStore(scope.env);

  const recordsUpserted = await store.importStoredInfringements(
    payload.records
  );

  let recomputed = false;

  if (payload.final) {
    await store.finalizeStoredImport();
    recomputed = true;
  }

  let totalRecords: number | undefined;

  if (payload.final) {
    totalRecords = await store.countInfringements();
  }

  return {
    final: payload.final,
    recomputed,
    recordsReceived: payload.records.length,
    recordsUpserted,
    totalRecords,
  };
};

/**
 * Validates and imports a batch from a snapshot.
 * @param scope - Application scope and writable parking store.
 * @param body - Untrusted snapshot batch payload.
 * @returns Received and upserted record counts.
 */
export const importSnapshotBatch = async (
  scope: AppScope,
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- The request body is untrusted and validated by the import schema.
  body: unknown
): Promise<{
  recordsReceived: number;
  recordsUpserted: number;
}> => {
  const payload = importSnapshotBatchSchema.parse(body);

  const result = await importStoredInfringements(scope, {
    final: false,
    records: payload.infringements,
  });

  return {
    recordsReceived: result.recordsReceived,
    recordsUpserted: result.recordsUpserted,
  };
};

/**
 * Exports a page of stored ingestion watermarks.
 * @param scope - Application scope and parking reader.
 * @param offset - Offset of the first watermark.
 * @param limit - Maximum watermarks to return.
 * @returns The exported page and total.
 */
export const exportStoredWatermarks = async (
  scope: AppScope,
  offset: number,
  limit: number
): Promise<ExportWatermarksResult> =>
  await scope.parking.exportWatermarks(offset, limit);

/**
 * Validates and imports ingestion watermarks.
 * @param scope - Application scope and writable parking store.
 * @param body - Untrusted request payload containing watermarks.
 * @returns Imported and total watermark counts.
 */
export const importStoredWatermarks = async (
  scope: AppScope,
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- The request body is untrusted and validated by the import schema.
  body: unknown
): Promise<{ imported: number; total: number }> => {
  assertParkingStoreWritable(scope);
  const payload = importWatermarksSchema.parse(body);
  const store = getParkingStore(scope.env);

  const [imported, exported] = await Promise.all([
    store.importWatermarks(payload.watermarks),
    store.exportWatermarks(0, 1),
  ]);

  return {
    imported,
    total: exported.total,
  };
};

/**
 * Finalizes a stored import and recomputes derived data.
 * @param scope - Application scope and writable parking store.
 * @returns Whether recomputation was performed.
 */
export const finalizeStoredImport = async (
  scope: AppScope
): Promise<{ recomputed: boolean }> => {
  assertParkingStoreWritable(scope);
  await getParkingStore(scope.env).finalizeStoredImport();

  return { recomputed: true };
};
