import { z } from "zod";

import {
  endOfDayInAucklandIso,
  instantInAucklandIso,
  localDateTimeInAucklandIso,
  startOfDayInAucklandIso,
} from "@/lib/auckland-time.ts";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/u;

const WALL_CLOCK =
  /^(?<date>\d{4}-\d{2}-\d{2})T(?<time>\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?)/u;

const snapshotRecordSchema = z.record(z.string(), z.json());

const migrateTimestampField = (
  record: z.infer<typeof snapshotRecordSchema>,
  key: string,
  migrate: (value: string) => string
): void => {
  const parsed = z.string().safeParse(record[key]);

  if (parsed.success) {
    record[key] = migrate(parsed.data);
  }
};

const extractWallClock = (
  value: string
): { date: string; time: string } | null => {
  const match = WALL_CLOCK.exec(value);
  const date = match?.groups?.date;
  const time = match?.groups?.time;

  if (date === undefined || time === undefined) {
    return null;
  }

  return { date, time };
};

/**
 * Re-encodes an infringement occurrence time preserving the NZ wall clock.
 * @param value - Date or timestamp to migrate.
 * @returns The corresponding Auckland ISO timestamp.
 */
export const migrateWallClockInstant = (value: string): string => {
  const trimmed = value.trim();

  if (trimmed === "") {
    throw new TypeError("Cannot migrate empty instant");
  }

  if (DATE_ONLY.test(trimmed)) {
    return localDateTimeInAucklandIso(trimmed, "00:00:00");
  }

  if (trimmed.endsWith("Z")) {
    return instantInAucklandIso(new Date(trimmed));
  }

  const wallClock = extractWallClock(trimmed);

  if (wallClock === null) {
    throw new TypeError(`Unrecognized wall-clock instant: ${value}`);
  }

  return localDateTimeInAucklandIso(wallClock.date, wallClock.time);
};

/**
 * Re-encodes a UTC, date-only, or wall-clock synchronization instant.
 * @param value - Date or timestamp to migrate.
 * @returns The corresponding Auckland ISO timestamp.
 */
export const migrateSyncInstant = (value: string): string => {
  const trimmed = value.trim();

  if (trimmed === "") {
    throw new TypeError("Cannot migrate empty instant");
  }

  if (DATE_ONLY.test(trimmed)) {
    return startOfDayInAucklandIso(trimmed);
  }

  if (trimmed.endsWith("Z")) {
    return instantInAucklandIso(new Date(trimmed));
  }

  const wallClock = extractWallClock(trimmed);

  if (wallClock === null) {
    throw new TypeError(`Unrecognized sync instant: ${value}`);
  }

  if (wallClock.time.startsWith("23:59:59")) {
    return endOfDayInAucklandIso(wallClock.date);
  }

  return localDateTimeInAucklandIso(wallClock.date, wallClock.time);
};

/**
 * Migrates an optional occurrence time, treating blank values as absent.
 * @param value - Optional date or timestamp.
 * @returns The Auckland ISO timestamp, or null when absent.
 */
export const migrateOptionalWallClockInstant = (
  value: string | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  return migrateWallClockInstant(trimmed);
};

/**
 * Migrates an optional closure time, using end of day for date-only values.
 * @param value - Optional closure date or timestamp.
 * @returns The Auckland ISO timestamp, or null when absent.
 */
export const migrateOptionalClosedAt = (
  value: string | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  if (DATE_ONLY.test(trimmed)) {
    return endOfDayInAucklandIso(trimmed);
  }

  return migrateWallClockInstant(trimmed);
};

/**
 * Migrates an optional synchronization instant, treating blanks as absent.
 * @param value - Optional synchronization date or timestamp.
 * @returns The Auckland ISO timestamp, or null when absent.
 */
export const migrateOptionalSyncInstant = (
  value: string | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  return migrateSyncInstant(trimmed);
};

const TIMESTAMP_META_KEYS = new Set([
  "last_csv_import_at",
  "last_hcc_fetch_at",
]);

/**
 * Identifies metadata values that represent timestamps requiring migration.
 * @param key - Synchronization metadata key.
 * @param value - Stored metadata value.
 * @returns Whether the value should be migrated as a timestamp.
 */
export const shouldMigrateSyncMetaValue = (
  key: string,
  value: string
): boolean =>
  TIMESTAMP_META_KEYS.has(key) ||
  value.endsWith("Z") ||
  DATE_ONLY.test(value) ||
  WALL_CLOCK.test(value);

/**
 * Migrates known timestamps within a serialized dashboard snapshot.
 * @param payload - JSON snapshot payload.
 * @returns The updated JSON, or the original payload for non-object JSON.
 */
export const migrateDashboardSnapshotPayload = (payload: string): string => {
  const result = snapshotRecordSchema.safeParse(JSON.parse(payload));

  if (!result.success) {
    return payload;
  }

  const parsed = result.data;
  migrateTimestampField(parsed, "at", migrateSyncInstant);

  const live = snapshotRecordSchema.safeParse(parsed.live);

  if (live.success) {
    migrateTimestampField(live.data, "lastSyncedAt", migrateSyncInstant);
    migrateTimestampField(live.data, "lastRecordAt", migrateWallClockInstant);
    parsed.live = live.data;
  }

  const recent = parsed.recentInfringements;

  if (Array.isArray(recent)) {
    for (const [index, item] of recent.entries()) {
      const record = snapshotRecordSchema.safeParse(item);

      if (record.success) {
        migrateTimestampField(
          record.data,
          "occurredAt",
          migrateWallClockInstant
        );
        recent[index] = record.data;
      }
    }
  }

  return JSON.stringify(parsed);
};
