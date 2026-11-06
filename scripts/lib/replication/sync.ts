/** Pull a ParkingStore snapshot from one worker and push JSON batches to another. */

import { setTimeout as delay } from "node:timers/promises";

import { formatNumber } from "@scripts/lib/backfill/progress.ts";
import {
  fetchExportInfringements,
  fetchExportWatermarks,
  postFinalizeStoredImport,
  postImportSnapshot,
  postImportWatermarks,
} from "@scripts/lib/replication/api.ts";
import type {
  IngestWatermarkExport,
  SnapshotWriteHandle,
} from "@scripts/lib/replication/snapshot.ts";
import type { WorkerScriptContext } from "@scripts/lib/worker/client.ts";

/**
 * Batch limits, progress reporting, and synchronization checkpoint settings.
 */
export interface SnapshotSyncOptions {
  batchSize: number;
  label: string;
  pauseMs: number;
  skipWatermarks: boolean;
  startAfter: number;
  writer?: SnapshotWriteHandle;
}

/**
 * Counts copied during worker snapshot synchronization.
 */
export interface SnapshotSyncResult {
  totalInfringements: number;
  uploadedInfringements: number;
  uploadedWatermarks: number;
}

/**
 * Copy an exported snapshot between authenticated workers.
 * @param source - Authenticated source worker connection.
 * @param destination - Authenticated destination worker connection.
 * @param options - Operation settings and progress callbacks.
 * @returns The resulting `Promise<SnapshotSyncResult>` value.
 */
export const syncSnapshotBetweenWorkers = async (
  source: WorkerScriptContext,
  destination: WorkerScriptContext,
  options: SnapshotSyncOptions
): Promise<SnapshotSyncResult> => {
  let cursor: number | null = options.startAfter;
  let uploadedInfringements = 0;
  let total = 0;

  while (cursor !== null) {
    const page = await fetchExportInfringements(
      source,
      cursor,
      options.batchSize,
      total === 0 ? "scan" : "cached"
    );

    ({ total } = page);

    if (page.records.length === 0) {
      break;
    }

    options.writer?.appendInfringements(page.records);
    const result = await postImportSnapshot(destination, page.records);
    uploadedInfringements += result.recordsUpserted;

    const last = page.records.at(-1);
    const resumeCursor = last?.infringementNumber ?? cursor;

    console.log(
      `[${options.label}] infringements ${formatNumber(uploadedInfringements)}/${formatNumber(total)} (resume: --start-after=${resumeCursor})`
    );

    cursor = page.nextCursor;

    if (cursor !== null && options.pauseMs > 0) {
      await delay(options.pauseMs);
    }
  }

  const watermarks: IngestWatermarkExport[] = [];
  let uploadedWatermarks = 0;

  if (!options.skipWatermarks) {
    let offset: number | null = 0;

    while (offset !== null) {
      const page = await fetchExportWatermarks(
        source,
        offset,
        options.batchSize
      );

      if (page.watermarks.length === 0) {
        break;
      }

      watermarks.push(...page.watermarks);
      await postImportWatermarks(destination, page.watermarks);
      uploadedWatermarks += page.watermarks.length;
      offset = page.nextOffset;

      console.log(
        `[${options.label}] watermarks ${formatNumber(uploadedWatermarks)}/${formatNumber(page.total)}`
      );

      if (options.pauseMs > 0) {
        await delay(options.pauseMs);
      }
    }
  }

  if (options.writer !== undefined) {
    await options.writer.close({
      totalInfringements: total,
      watermarks,
    });
  }

  await postFinalizeStoredImport(destination);

  return {
    totalInfringements: total,
    uploadedInfringements,
    uploadedWatermarks,
  };
};
