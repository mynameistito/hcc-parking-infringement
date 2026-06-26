import type { CleanInfringement } from "@/server/clean.ts";

export type SyncRunType = "hourly" | "manual" | "backfill";

export interface SyncWindowPayload {
  runType: SyncRunType;
  start: string;
  end: string;
  records: CleanInfringement[];
  recordsFetched: number;
  skipped: number;
}

export interface SyncWindowResult {
  runId: number;
  recordsFetched: number;
  recordsUpserted: number;
  skipped: number;
}

export interface ImportBatchPayload {
  records: CleanInfringement[];
  recordsReceived: number;
  skipped: number;
  final: boolean;
}

export interface ImportBatchResult {
  recordsReceived: number;
  recordsUpserted: number;
  skipped: number;
  recomputed: boolean;
  totalRecords: number;
}

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

export interface DateWindow {
  start: string;
  end: string;
}

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

export interface CacheStatus {
  source: "parking-store";
  totalRecords: number;
  lastHccFetchAt: string | null;
  lastSyncedAt: string | null;
  ingestWindows: number;
}
