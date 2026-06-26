import { subDays } from "date-fns";

import type {
  LocationRankItem,
  PublicTopItem,
  TopGroupBy,
  TopStatRow,
  TopWindow,
  VehicleRankItem,
} from "@/durable-objects/types.ts";
import {
  formatDateInAuckland,
  startOfDayInAucklandIso,
} from "@/lib/auckland-time.ts";

import { browseStreets } from "./browse-queries.ts";

const topGroupedColumn = (groupBy: "street" | "offence"): string =>
  groupBy === "street" ? "street" : "offence_description";

export const getTopStats = (
  sql: SqlStorage,
  groupBy: TopGroupBy,
  window: TopWindow,
  limit: number
): TopStatRow[] => {
  const column = topGroupedColumn(groupBy);
  const startDate =
    window === "all"
      ? null
      : formatDateInAuckland(subDays(new Date(), window === "7d" ? 7 : 30));

  const rows =
    startDate === null
      ? sql
          .exec<{ key: string; count: number; total_cents: number }>(
            `SELECT ${column} as key, count(*) as count, coalesce(sum(amount_cents), 0) as total_cents
           FROM infringements
           WHERE ${column} != ''
           GROUP BY ${column}
           ORDER BY count DESC
           LIMIT ?`,
            limit
          )
          .toArray()
      : sql
          .exec<{ key: string; count: number; total_cents: number }>(
            `SELECT ${column} as key, count(*) as count, coalesce(sum(amount_cents), 0) as total_cents
           FROM infringements
           WHERE ${column} != '' AND occurred_at >= ?
           GROUP BY ${column}
           ORDER BY count DESC
           LIMIT ?`,
            startOfDayInAucklandIso(startDate),
            limit
          )
          .toArray();

  return rows.map((row) => ({
    count: row.count,
    key: row.key,
    totalCents: row.total_cents,
  }));
};

export const getTopSuburbs = (
  sql: SqlStorage,
  limit: number
): LocationRankItem[] => {
  const rows = sql
    .exec<{ suburb: string; count: number }>(
      `SELECT coalesce(suburb, 'Unknown') as suburb, count(*) as count
       FROM infringements
       WHERE suburb IS NOT NULL AND suburb != ''
       GROUP BY suburb
       ORDER BY count DESC
       LIMIT ?`,
      limit
    )
    .toArray();

  return rows.map((row) => ({
    count: row.count,
    label: row.suburb,
    suburb: row.suburb,
  }));
};

export const getTopVehicles = (
  sql: SqlStorage,
  limit: number
): VehicleRankItem[] => {
  const rows = sql
    .exec<{ make: string; model: string; count: number }>(
      `SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') as make,
              coalesce(nullif(trim(vehicle_model), ''), '') as model,
              count(*) as count
       FROM infringements
       WHERE (vehicle_make IS NOT NULL AND trim(vehicle_make) != '')
          OR (vehicle_model IS NOT NULL AND trim(vehicle_model) != '')
       GROUP BY vehicle_make, vehicle_model
       ORDER BY count DESC
       LIMIT ?`,
      limit
    )
    .toArray();

  return rows.map((row) => ({
    count: row.count,
    label: row.model ? `${row.make} ${row.model}` : row.make,
    make: row.make,
    model: row.model,
  }));
};

export const getPublicTop = (
  sql: SqlStorage,
  groupBy: "street" | "offence",
  limit: number
): PublicTopItem[] =>
  getTopStats(sql, groupBy, "all", limit).map((row) => ({
    count: row.count,
    label: row.key.trim(),
  }));

export const getTopStreets = (
  sql: SqlStorage,
  limit: number
): LocationRankItem[] =>
  getTopStats(sql, "street", "all", limit).map((row) => ({
    count: row.count,
    label: row.key,
    street: row.key,
  }));

export const getStreetsInSuburb = (
  sql: SqlStorage,
  suburb: string,
  limit: number
): LocationRankItem[] =>
  browseStreets(sql, {
    limit,
    page: 1,
    sort: "count",
    suburb,
  }).items;

export const readTopGrouped = (
  sql: SqlStorage,
  groupBy: "street" | "offence",
  limit: number
): PublicTopItem[] => {
  const column = topGroupedColumn(groupBy);
  const rows = sql
    .exec<{ key: string; count: number }>(
      `SELECT ${column} as key, count(*) as count
       FROM infringements
       WHERE ${column} != ''
       GROUP BY ${column}
       ORDER BY count DESC
       LIMIT ?`,
      limit
    )
    .toArray();

  return rows.map((row) => ({
    count: row.count,
    label: row.key.trim(),
  }));
};

export const readTopStreetsRanked = (
  sql: SqlStorage,
  limit: number
): LocationRankItem[] =>
  readTopGrouped(sql, "street", limit).map((row) => ({
    count: row.count,
    label: row.label,
    street: row.label,
  }));

export const readTopSuburbsRanked = (
  sql: SqlStorage,
  limit: number
): LocationRankItem[] => getTopSuburbs(sql, limit);

export const readTopVehicles = (
  sql: SqlStorage,
  limit: number
): VehicleRankItem[] => getTopVehicles(sql, limit);
