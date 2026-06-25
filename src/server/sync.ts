import { formatInTimeZone } from "date-fns-tz";

import type { DateWindow } from "../durable-objects/parking-store.ts";
import type { BackfillMessage, Env } from "../env.ts";
import { cleanInfringements } from "./clean.ts";
import { fetchAllInWindow } from "./hcc-client.ts";
import type { FetchAllResult } from "./hcc-client.ts";
import { getParkingStore } from "./store.ts";

const AUCKLAND_TZ = "Pacific/Auckland";
const BACKFILL_EARLIEST = "2020-01-01";
/** Only re-fetch recent days from HCC; historical data lives in ParkingStore. */
const HOURLY_OVERLAP_DAYS = 2;
const PAGE_SIZE_LIMIT = 10_000;

export type SyncRunType = "hourly" | "manual" | "backfill";

export interface SyncWindowOptions {
  start: string;
  end: string;
  runType: SyncRunType;
  force?: boolean;
}

export interface SyncWindowResult {
  runId: number;
  recordsFetched: number;
  recordsUpserted: number;
  skipped: number;
  possiblyTruncated: boolean;
  hccSkipped?: boolean;
}

const formatDateInAuckland = (date: Date): string =>
  formatInTimeZone(date, AUCKLAND_TZ, "yyyy-MM-dd");

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const splitDateRange = (startDate: string, endDate: string): DateWindow[] => {
  const chunks: DateWindow[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    const chunkEnd = addDays(cursor, 6);
    chunks.push({
      end: chunkEnd > endDate ? endDate : chunkEnd,
      start: cursor,
    });
    cursor = addDays(chunkEnd, 1);
  }

  return chunks;
};

export const syncWindow = async (
  env: Env,
  options: SyncWindowOptions,
  prefetched?: FetchAllResult
): Promise<SyncWindowResult> => {
  const store = getParkingStore(env);

  if (options.force !== true && prefetched === undefined) {
    const alreadyIngested = await store.isWindowIngested(
      options.start,
      options.end
    );
    if (alreadyIngested) {
      return {
        hccSkipped: true,
        possiblyTruncated: false,
        recordsFetched: 0,
        recordsUpserted: 0,
        runId: 0,
        skipped: 0,
      };
    }
  }

  const { records, possiblyTruncated } =
    prefetched ?? (await fetchAllInWindow(env, options.start, options.end));
  const { cleaned, skipped } = cleanInfringements(records);

  const result = await store.applySyncWindow({
    end: options.end,
    records: cleaned,
    recordsFetched: records.length,
    runType: options.runType,
    skipped,
    start: options.start,
  });

  return {
    ...result,
    hccSkipped: false,
    possiblyTruncated,
  };
};

export const hourlySync = async (
  env: Env,
  runType: SyncRunType = "hourly"
): Promise<SyncWindowResult> => {
  const today = formatDateInAuckland(new Date());
  const start = addDays(today, -HOURLY_OVERLAP_DAYS);
  return await syncWindow(env, { end: today, runType, start });
};

export const startBackfill = async (
  env: Env,
  options?: { force?: boolean }
): Promise<{ enqueued: number; skipped: number; total: number }> => {
  const today = formatDateInAuckland(new Date());
  const chunks = splitDateRange(BACKFILL_EARLIEST, today);
  const store = getParkingStore(env);

  const pending =
    options?.force === true ? chunks : await store.filterPendingChunks(chunks);

  await Promise.all(
    pending.map(async (chunk) => {
      const message: BackfillMessage = {
        endDate: chunk.end,
        force: options?.force,
        startDate: chunk.start,
      };
      return await env.BACKFILL_QUEUE.send(message);
    })
  );

  return {
    enqueued: pending.length,
    skipped: chunks.length - pending.length,
    total: chunks.length,
  };
};

export const processBackfillMessage = async (
  env: Env,
  message: BackfillMessage
): Promise<{
  split: boolean;
  skipped?: boolean;
  result?: SyncWindowResult;
}> => {
  const store = getParkingStore(env);

  if (message.force !== true) {
    const alreadyIngested = await store.isWindowIngested(
      message.startDate,
      message.endDate
    );
    if (alreadyIngested) {
      return { skipped: true, split: false };
    }
  }

  const fetched = await fetchAllInWindow(
    env,
    message.startDate,
    message.endDate
  );

  if (
    fetched.possiblyTruncated ||
    (fetched.pageCount === 1 && fetched.records.length >= PAGE_SIZE_LIMIT)
  ) {
    const start = new Date(`${message.startDate}T12:00:00Z`);
    const end = new Date(`${message.endDate}T12:00:00Z`);
    const midpoint = new Date((start.getTime() + end.getTime()) / 2);
    const midStr = midpoint.toISOString().slice(0, 10);

    if (midStr > message.startDate && midStr < message.endDate) {
      await env.BACKFILL_QUEUE.send({
        endDate: midStr,
        force: message.force,
        startDate: message.startDate,
      });
      await env.BACKFILL_QUEUE.send({
        endDate: message.endDate,
        force: message.force,
        startDate: addDays(midStr, 1),
      });
      return { split: true };
    }
  }

  const result = await syncWindow(
    env,
    {
      end: message.endDate,
      force: message.force,
      runType: "backfill",
      start: message.startDate,
    },
    fetched
  );

  return { result, split: false };
};

export const getLatestSyncRun = async (env: Env) =>
  await getParkingStore(env).getLatestSyncRun();

export { PAGE_SIZE_LIMIT, splitDateRange };
