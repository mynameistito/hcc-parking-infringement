import type { CleanInfringement } from "@/server/clean.ts";

/** The source of a parking-data synchronization run. */
export type SyncRunType = "hourly" | "manual" | "backfill";

/** Cleaned records and fetch counts to apply for a synchronization window. */
export interface SyncWindowPayload {
  runType: SyncRunType;
  start: string;
  end: string;
  records: CleanInfringement[];
  recordsFetched: number;
  skipped: number;
}

/** The recorded run identifier and counts after applying a sync window. */
export interface SyncWindowResult {
  runId: number;
  recordsFetched: number;
  recordsUpserted: number;
  skipped: number;
}

/** Cleaned records and counters for a stored-data import batch. */
export interface ImportBatchPayload {
  records: CleanInfringement[];
  recordsReceived: number;
  skipped: number;
  final: boolean;
}

/** Import counts and derived-state status after a batch is applied. */
export interface ImportBatchResult {
  recordsReceived: number;
  recordsUpserted: number;
  skipped: number;
  recomputed: boolean;
  totalRecords: number;
}

/** Persisted synchronization run metadata and outcome. */
export interface SyncRunRow {
  id: number;
  runType: string;
  windowStart: string;
  windowEnd: string;
  fetched: number;
  inserted: number;
  updated: number;
  status: string;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

/** Start and end date keys identifying an ingestion window. */
export interface DateWindow {
  start: string;
  end: string;
}

/** Backfill completion, latest watermark, and stored-record totals. */
export interface BackfillProgress {
  chunkDays: number;
  completed: number;
  end: string;
  latestIngestedAt: string | null;
  latestWindow: { end: string; start: string } | null;
  percent: number;
  start: string;
  total: number;
  totalRecords: number;
}

/** Read-source identity, record count, and latest synchronization metadata. */
export interface CacheStatus {
  source: "parking-store" | "parking-store-seed";
  totalRecords: number;
  lastHccFetchAt: string | null;
  lastSyncedAt: string | null;
  ingestWindows: number;
}
