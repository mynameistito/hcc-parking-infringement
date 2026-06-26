import type { CleanInfringement } from "@/server/clean-schema.ts";

import {
  bumpCachedInfringementCount,
  resolveInfringementCount,
} from "./infringement-count.ts";
import { upsertInfringements } from "./sync.ts";

export type ExportTotalMode = "cached" | "scan";

export interface ExportInfringementsResult {
  nextCursor: number | null;
  records: CleanInfringement[];
  total: number;
}

interface StoredInfringementRow extends Record<string, SqlStorageValue> {
  additional_costs_cents: number;
  amount_cents: number;
  closed_at: string | null;
  court_serve_method: string | null;
  infringement_number: number;
  infringement_type: number | null;
  is_towed: number;
  occurred_at: string;
  offence_category: string | null;
  offence_code: string | null;
  offence_description: string;
  post_code: string | null;
  street: string;
  suburb: string | null;
  town: string | null;
  vehicle_colour: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_type: string | null;
}

const mapStoredRow = (row: StoredInfringementRow): CleanInfringement => ({
  additionalCostsCents: row.additional_costs_cents,
  amountCents: row.amount_cents,
  closedAt: row.closed_at,
  courtServeMethod: row.court_serve_method,
  infringementNumber: row.infringement_number,
  infringementType: row.infringement_type,
  isTowed: row.is_towed === 1,
  occurredAt: row.occurred_at,
  offenceCategory: row.offence_category,
  offenceCode: row.offence_code ?? "",
  offenceDescription: row.offence_description,
  postCode: row.post_code,
  street: row.street,
  suburb: row.suburb,
  town: row.town ?? "Hamilton",
  vehicleColour: row.vehicle_colour,
  vehicleMake: row.vehicle_make,
  vehicleModel: row.vehicle_model,
  vehicleType: row.vehicle_type,
});

export const exportInfringements = (
  sql: SqlStorage,
  after: number,
  limit: number,
  totalMode: ExportTotalMode = "cached"
): ExportInfringementsResult => {
  const rows = sql
    .exec<StoredInfringementRow>(
      `SELECT
        infringement_number, occurred_at, closed_at, amount_cents,
        additional_costs_cents, street, suburb, town, post_code,
        offence_code, offence_description, offence_category,
        infringement_type, court_serve_method,
        vehicle_colour, vehicle_make, vehicle_model, vehicle_type,
        is_towed
      FROM infringements
      WHERE infringement_number > ?
      ORDER BY infringement_number ASC
      LIMIT ?`,
      after,
      limit
    )
    .toArray();

  const last = rows.at(-1);

  return {
    nextCursor:
      rows.length < limit || last === undefined
        ? null
        : last.infringement_number,
    records: rows.map(mapStoredRow),
    total: resolveInfringementCount(sql, totalMode),
  };
};

export const importStoredInfringements = (
  sql: SqlStorage,
  records: CleanInfringement[]
): number => {
  const upserted = upsertInfringements(sql, records);
  bumpCachedInfringementCount(sql, upserted);
  return upserted;
};

export interface IngestWatermarkExport {
  end: string;
  ingestedAt: string;
  recordCount: number;
  start: string;
}

export interface ExportWatermarksResult {
  nextOffset: number | null;
  total: number;
  watermarks: IngestWatermarkExport[];
}

export const exportWatermarks = (
  sql: SqlStorage,
  offset: number,
  limit: number
): ExportWatermarksResult => {
  const totalRow = sql
    .exec<{ total: number }>("SELECT count(*) as total FROM ingest_watermarks")
    .one();

  const rows = sql
    .exec<{
      ingested_at: string;
      record_count: number;
      window_end: string;
      window_start: string;
    }>(
      `SELECT window_start, window_end, record_count, ingested_at
       FROM ingest_watermarks
       ORDER BY window_start ASC, window_end ASC
       LIMIT ? OFFSET ?`,
      limit,
      offset
    )
    .toArray();

  const total = totalRow?.total ?? 0;
  const nextOffset = offset + rows.length;

  return {
    nextOffset: nextOffset >= total ? null : nextOffset,
    total,
    watermarks: rows.map((row) => ({
      end: row.window_end,
      ingestedAt: row.ingested_at,
      recordCount: row.record_count,
      start: row.window_start,
    })),
  };
};

export const importWatermarks = (
  sql: SqlStorage,
  watermarks: readonly IngestWatermarkExport[]
): number => {
  for (const watermark of watermarks) {
    sql.exec(
      `INSERT INTO ingest_watermarks (window_start, window_end, record_count, ingested_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(window_start, window_end) DO UPDATE SET
         record_count = excluded.record_count,
         ingested_at = excluded.ingested_at`,
      watermark.start,
      watermark.end,
      watermark.recordCount,
      watermark.ingestedAt
    );
  }

  return watermarks.length;
};

export const finalizeStoredImport = (onFinalize: () => void): void => {
  onFinalize();
};
