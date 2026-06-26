import {
  endOfDayInAucklandIso,
  instantInAucklandIso,
  localDateTimeInAucklandIso,
  startOfDayInAucklandIso,
} from "@/lib/auckland-time.ts";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/u;
const WALL_CLOCK =
  /^(?<date>\d{4}-\d{2}-\d{2})T(?<time>\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?)/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

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

/** Re-encode infringement occurrence times preserving NZ wall clock. */
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

/** Re-encode sync/metadata instants (UTC Z, date-only, or wall clock). */
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

export const shouldMigrateSyncMetaValue = (
  key: string,
  value: string
): boolean =>
  TIMESTAMP_META_KEYS.has(key) ||
  value.endsWith("Z") ||
  DATE_ONLY.test(value) ||
  WALL_CLOCK.test(value);

export const migrateDashboardSnapshotPayload = (payload: string): string => {
  const parsed: unknown = JSON.parse(payload);
  if (!isRecord(parsed)) {
    return payload;
  }

  if (typeof parsed.at === "string") {
    parsed.at = migrateSyncInstant(parsed.at);
  }

  const { live } = parsed;
  if (isRecord(live)) {
    if (typeof live.lastSyncedAt === "string") {
      live.lastSyncedAt = migrateSyncInstant(live.lastSyncedAt);
    }
    if (typeof live.lastRecordAt === "string") {
      live.lastRecordAt = migrateWallClockInstant(live.lastRecordAt);
    }
  }

  const recent = parsed.recentInfringements;
  if (Array.isArray(recent)) {
    for (const item of recent) {
      if (isRecord(item) && typeof item.occurredAt === "string") {
        item.occurredAt = migrateWallClockInstant(item.occurredAt);
      }
    }
  }

  return JSON.stringify(parsed);
};
