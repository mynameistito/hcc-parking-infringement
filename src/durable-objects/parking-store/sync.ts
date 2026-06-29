import type { SyncRunRow, SyncRunType } from "@/durable-objects/types.ts";
import type { CleanInfringement } from "@/server/clean.ts";

import { isoNow } from "./constants.ts";

export const startSyncRun = (
  sql: SqlStorage,
  runType: SyncRunType,
  start: string,
  end: string
): number => {
  const result = sql.exec<{ id: number }>(
    `INSERT INTO sync_runs (run_type, window_start, window_end, status, started_at)
     VALUES (?, ?, ?, 'running', ?)
     RETURNING id`,
    runType,
    start,
    end,
    isoNow()
  );
  const runId = result.one().id;
  if (!runId) {
    throw new Error("Failed to create sync run");
  }
  return runId;
};

export const finishSyncRun = (
  sql: SqlStorage,
  runId: number,
  status: "success" | "error",
  details: { fetched: number; upserted: number; error?: string }
): void => {
  sql.exec(
    `UPDATE sync_runs
     SET finished_at = ?, status = ?, fetched = ?, inserted = ?, updated = 0, error = ?
     WHERE id = ?`,
    isoNow(),
    status,
    details.fetched,
    details.upserted,
    details.error ?? null,
    runId
  );
};

const UPSERT_COLUMNS = `infringement_number, occurred_at, closed_at, amount_cents,
  additional_costs_cents, street, suburb, town, post_code,
  offence_code, offence_description, offence_category,
  infringement_type, court_serve_method,
  vehicle_colour, vehicle_make, vehicle_model, vehicle_type,
  is_towed, first_seen_at, updated_at`;

const UPSERT_ROW_PLACEHOLDERS =
  "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

const UPSERT_ON_CONFLICT = `ON CONFLICT(infringement_number) DO UPDATE SET
  occurred_at = excluded.occurred_at,
  closed_at = excluded.closed_at,
  amount_cents = excluded.amount_cents,
  additional_costs_cents = excluded.additional_costs_cents,
  street = excluded.street,
  suburb = excluded.suburb,
  town = excluded.town,
  post_code = excluded.post_code,
  offence_code = excluded.offence_code,
  offence_description = excluded.offence_description,
  offence_category = excluded.offence_category,
  infringement_type = excluded.infringement_type,
  court_serve_method = excluded.court_serve_method,
  vehicle_colour = excluded.vehicle_colour,
  vehicle_make = excluded.vehicle_make,
  vehicle_model = excluded.vehicle_model,
  vehicle_type = excluded.vehicle_type,
  is_towed = excluded.is_towed,
  updated_at = excluded.updated_at`;

/** Keep each INSERT under local DO SQLite's bind-variable limit. */
const UPSERT_BATCH_SIZE = 1;

const infringementToUpsertParams = (
  record: CleanInfringement,
  now: string
): SqlStorageValue[] => [
  record.infringementNumber,
  record.occurredAt,
  record.closedAt,
  record.amountCents,
  record.additionalCostsCents,
  record.street,
  record.suburb,
  record.town,
  record.postCode,
  record.offenceCode,
  record.offenceDescription,
  record.offenceCategory,
  record.infringementType,
  record.courtServeMethod,
  record.vehicleColour,
  record.vehicleMake,
  record.vehicleModel,
  record.vehicleType,
  record.isTowed ? 1 : 0,
  now,
  now,
];

export const upsertInfringements = (
  sql: SqlStorage,
  records: CleanInfringement[]
): number => {
  if (records.length === 0) {
    return 0;
  }

  const now = isoNow();

  for (let offset = 0; offset < records.length; offset += UPSERT_BATCH_SIZE) {
    const batch = records.slice(offset, offset + UPSERT_BATCH_SIZE);
    const placeholders = batch.map(() => UPSERT_ROW_PLACEHOLDERS).join(", ");
    const params = batch.flatMap((record) =>
      infringementToUpsertParams(record, now)
    );

    sql.exec(
      `INSERT INTO infringements (${UPSERT_COLUMNS}) VALUES ${placeholders}
      ${UPSERT_ON_CONFLICT}`,
      ...params
    );
  }

  return records.length;
};

export const hasWatermark = (
  sql: SqlStorage,
  start: string,
  end: string
): boolean => {
  const rows = sql
    .exec<{ found: number }>(
      `SELECT 1 as found FROM ingest_watermarks
       WHERE window_start = ? AND window_end = ?
       LIMIT 1`,
      start,
      end
    )
    .toArray();

  return rows.length > 0;
};

export const recordWatermark = (
  sql: SqlStorage,
  start: string,
  end: string,
  recordCount: number
): void => {
  sql.exec(
    `INSERT INTO ingest_watermarks (window_start, window_end, record_count, ingested_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(window_start, window_end) DO UPDATE SET
       record_count = excluded.record_count,
       ingested_at = excluded.ingested_at`,
    start,
    end,
    recordCount,
    isoNow()
  );
};

export const getSyncMeta = (sql: SqlStorage, key: string): string | null => {
  const rows = sql
    .exec<{ value: string }>(
      "SELECT value FROM sync_meta WHERE key = ? LIMIT 1",
      key
    )
    .toArray();

  return rows[0]?.value ?? null;
};

export const setSyncMeta = (
  sql: SqlStorage,
  key: string,
  value: string
): void => {
  sql.exec(
    `INSERT INTO sync_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value
  );
};

export const clearSyncMeta = (sql: SqlStorage, key: string): void => {
  sql.exec("DELETE FROM sync_meta WHERE key = ?", key);
};

export const getLatestSyncRun = (sql: SqlStorage): SyncRunRow | null => {
  const rows = sql
    .exec<{
      error: string | null;
      fetched: number;
      finished_at: string | null;
      id: number;
      inserted: number;
      run_type: string;
      started_at: string;
      status: string;
      updated: number;
      window_end: string;
      window_start: string;
    }>(`SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 1`)
    .toArray();

  const [row] = rows;

  if (row === undefined) {
    return null;
  }

  return {
    error: row.error,
    fetched: row.fetched,
    finishedAt: row.finished_at,
    id: row.id,
    inserted: row.inserted,
    runType: row.run_type,
    startedAt: row.started_at,
    status: row.status,
    updated: row.updated,
    windowEnd: row.window_end,
    windowStart: row.window_start,
  };
};
