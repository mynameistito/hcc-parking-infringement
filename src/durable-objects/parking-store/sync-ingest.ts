import type {
  ImportBatchPayload,
  ImportBatchResult,
  SyncWindowPayload,
  SyncWindowResult,
} from "@/durable-objects/types.ts";

import { isoNow } from "./constants.ts";
import { countInfringements } from "./infringements.ts";
import {
  finishSyncRun,
  recordWatermark,
  setSyncMeta,
  startSyncRun,
  upsertInfringements,
} from "./sync.ts";

export const applySyncWindow = (
  sql: SqlStorage,
  payload: SyncWindowPayload,
  hooks: {
    markBackfillStatsDirty: () => void;
    onIncrementalSuccess: () => void;
  }
): SyncWindowResult => {
  const runId = startSyncRun(sql, payload.runType, payload.start, payload.end);

  try {
    const recordsUpserted = upsertInfringements(sql, payload.records);

    if (payload.runType === "backfill") {
      hooks.markBackfillStatsDirty();
    } else {
      hooks.onIncrementalSuccess();
    }

    finishSyncRun(sql, runId, "success", {
      fetched: payload.recordsFetched,
      upserted: recordsUpserted,
    });

    recordWatermark(sql, payload.start, payload.end, payload.recordsFetched);
    setSyncMeta(sql, "last_hcc_fetch_at", isoNow());

    return {
      recordsFetched: payload.recordsFetched,
      recordsUpserted,
      runId,
      skipped: payload.skipped,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    finishSyncRun(sql, runId, "error", {
      error: message,
      fetched: 0,
      upserted: 0,
    });
    throw error;
  }
};

export const recordBackfillFailure = (
  sql: SqlStorage,
  start: string,
  end: string,
  error: string
): void => {
  const runId = startSyncRun(sql, "backfill", start, end);
  finishSyncRun(sql, runId, "error", {
    error,
    fetched: 0,
    upserted: 0,
  });
};

export const importInfringementBatch = (
  sql: SqlStorage,
  payload: ImportBatchPayload,
  onFinalBatch: () => void
): ImportBatchResult => {
  const recordsUpserted = upsertInfringements(sql, payload.records);

  if (payload.final) {
    onFinalBatch();
    setSyncMeta(sql, "last_csv_import_at", isoNow());
  }

  return {
    recomputed: payload.final,
    recordsReceived: payload.recordsReceived,
    recordsUpserted,
    skipped: payload.skipped,
    totalRecords: countInfringements(sql),
  };
};
