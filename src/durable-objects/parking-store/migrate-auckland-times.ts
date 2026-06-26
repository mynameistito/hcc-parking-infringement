import {
  migrateDashboardSnapshotPayload,
  migrateOptionalClosedAt,
  migrateOptionalSyncInstant,
  migrateOptionalWallClockInstant,
  migrateSyncInstant,
  migrateWallClockInstant,
  shouldMigrateSyncMetaValue,
} from "@/lib/migrate-instant-to-auckland.ts";

export const migrateParkingStoreTimestampsToAuckland = (
  sql: SqlStorage
): void => {
  const infringements = sql
    .exec<{
      closed_at: string | null;
      first_seen_at: string;
      infringement_number: number;
      occurred_at: string;
      updated_at: string;
    }>(
      `SELECT infringement_number, occurred_at, closed_at, first_seen_at, updated_at
       FROM infringements`
    )
    .toArray();

  for (const row of infringements) {
    sql.exec(
      `UPDATE infringements
       SET occurred_at = ?, closed_at = ?, first_seen_at = ?, updated_at = ?
       WHERE infringement_number = ?`,
      migrateWallClockInstant(row.occurred_at),
      migrateOptionalClosedAt(row.closed_at),
      migrateSyncInstant(row.first_seen_at),
      migrateSyncInstant(row.updated_at),
      row.infringement_number
    );
  }

  const syncRuns = sql
    .exec<{
      finished_at: string | null;
      id: number;
      started_at: string;
    }>("SELECT id, started_at, finished_at FROM sync_runs")
    .toArray();

  for (const row of syncRuns) {
    sql.exec(
      `UPDATE sync_runs
       SET started_at = ?, finished_at = ?
       WHERE id = ?`,
      migrateSyncInstant(row.started_at),
      migrateOptionalSyncInstant(row.finished_at),
      row.id
    );
  }

  const statsRow = sql
    .exec<{
      last_record_at: string | null;
      last_synced_at: string | null;
    }>(
      "SELECT last_synced_at, last_record_at FROM stats_live WHERE id = 1 LIMIT 1"
    )
    .one();

  if (statsRow !== undefined) {
    sql.exec(
      `UPDATE stats_live
       SET last_synced_at = ?, last_record_at = ?
       WHERE id = 1`,
      migrateOptionalSyncInstant(statsRow.last_synced_at),
      migrateOptionalWallClockInstant(statsRow.last_record_at)
    );
  }

  const watermarks = sql
    .exec<{
      ingested_at: string;
      window_end: string;
      window_start: string;
    }>("SELECT window_start, window_end, ingested_at FROM ingest_watermarks")
    .toArray();

  for (const row of watermarks) {
    sql.exec(
      `UPDATE ingest_watermarks
       SET ingested_at = ?
       WHERE window_start = ? AND window_end = ?`,
      migrateSyncInstant(row.ingested_at),
      row.window_start,
      row.window_end
    );
  }

  const metaRows = sql
    .exec<{ key: string; value: string }>("SELECT key, value FROM sync_meta")
    .toArray();

  for (const row of metaRows) {
    if (!shouldMigrateSyncMetaValue(row.key, row.value)) {
      continue;
    }
    sql.exec(
      "UPDATE sync_meta SET value = ? WHERE key = ?",
      migrateSyncInstant(row.value),
      row.key
    );
  }

  const locations = sql
    .exec<{
      geocode_failed_at: string | null;
      geocoded_at: string;
      street: string;
      suburb: string;
    }>(
      `SELECT street, suburb, geocoded_at, geocode_failed_at
       FROM location_cache`
    )
    .toArray();

  for (const row of locations) {
    sql.exec(
      `UPDATE location_cache
       SET geocoded_at = ?, geocode_failed_at = ?
       WHERE street = ? AND suburb = ?`,
      migrateSyncInstant(row.geocoded_at),
      migrateOptionalSyncInstant(row.geocode_failed_at),
      row.street,
      row.suburb
    );
  }

  const snapshotRows = sql
    .exec<{ id: number; payload: string; updated_at: string }>(
      "SELECT id, payload, updated_at FROM dashboard_snapshot_cache"
    )
    .toArray();

  for (const row of snapshotRows) {
    sql.exec(
      `UPDATE dashboard_snapshot_cache
       SET payload = ?, updated_at = ?
       WHERE id = ?`,
      migrateDashboardSnapshotPayload(row.payload),
      migrateSyncInstant(row.updated_at),
      row.id
    );
  }
};
