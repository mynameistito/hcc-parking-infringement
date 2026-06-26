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

export const exportStoredInfringements = async (
  scope: AppScope,
  after: number,
  limit: number,
  totalMode: ExportTotalMode = "cached"
): Promise<ExportInfringementsResult> =>
  await scope.parking.exportInfringements(after, limit, totalMode);

export const importStoredInfringements = async (
  scope: AppScope,
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

export const importSnapshotBatch = async (
  scope: AppScope,
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

export const exportStoredWatermarks = async (
  scope: AppScope,
  offset: number,
  limit: number
): Promise<ExportWatermarksResult> =>
  await scope.parking.exportWatermarks(offset, limit);

export const importStoredWatermarks = async (
  scope: AppScope,
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

export const finalizeStoredImport = async (
  scope: AppScope
): Promise<{ recomputed: boolean }> => {
  assertParkingStoreWritable(scope);
  await getParkingStore(scope.env).finalizeStoredImport();
  return { recomputed: true };
};
