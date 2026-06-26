import { z } from "zod";

import type {
  ExportInfringementsResult,
  ExportTotalMode,
  ExportWatermarksResult,
} from "@/durable-objects/parking-store/replication.ts";
import { cleanInfringementSchema } from "@/server/clean-schema.ts";
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
  env: Env,
  after: number,
  limit: number,
  totalMode: ExportTotalMode = "cached"
): Promise<ExportInfringementsResult> =>
  await getParkingStore(env).exportInfringements(after, limit, totalMode);

export const importStoredInfringements = async (
  env: Env,
  body: unknown
): Promise<{
  final: boolean;
  recordsReceived: number;
  recordsUpserted: number;
  recomputed: boolean;
  totalRecords?: number;
}> => {
  const payload = importStoredBatchSchema.parse(body);
  const store = getParkingStore(env);
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
  env: Env,
  body: unknown
): Promise<{
  recordsReceived: number;
  recordsUpserted: number;
}> => {
  const payload = importSnapshotBatchSchema.parse(body);
  const result = await importStoredInfringements(env, {
    final: false,
    records: payload.infringements,
  });

  return {
    recordsReceived: result.recordsReceived,
    recordsUpserted: result.recordsUpserted,
  };
};

export const exportStoredWatermarks = async (
  env: Env,
  offset: number,
  limit: number
): Promise<ExportWatermarksResult> =>
  await getParkingStore(env).exportWatermarks(offset, limit);

export const importStoredWatermarks = async (
  env: Env,
  body: unknown
): Promise<{ imported: number; total: number }> => {
  const payload = importWatermarksSchema.parse(body);
  const store = getParkingStore(env);
  const imported = await store.importWatermarks(payload.watermarks);
  const exported = await store.exportWatermarks(0, 1);

  return {
    imported,
    total: exported.total,
  };
};

export const finalizeStoredImport = async (
  env: Env
): Promise<{ recomputed: boolean }> => {
  await getParkingStore(env).finalizeStoredImport();
  return { recomputed: true };
};
