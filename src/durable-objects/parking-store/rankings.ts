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
import { formatStreetSuburb } from "@/lib/format.ts";
import { resolveOffenceDescription } from "@/lib/offence-catalog.ts";

import { browseStreets } from "./browse-queries.ts";

const STREET_SUBURB_EXPR = "coalesce(nullif(trim(suburb), ''), 'Unknown')";

const toStreetLocationRankItem = (row: {
  street: string;
  suburb: string;
  count: number;
}): LocationRankItem => ({
  count: row.count,
  label: formatStreetSuburb(row.street, row.suburb),
  street: row.street,
  suburb: row.suburb === "Unknown" ? undefined : row.suburb,
});

const toStreetTopItem = (row: {
  street: string;
  suburb: string;
  count: number;
}): PublicTopItem => ({
  count: row.count,
  label: formatStreetSuburb(row.street, row.suburb),
});

const toOffenceTopItem = (row: {
  code: string;
  description: string;
  count: number;
}): PublicTopItem => ({
  count: row.count,
  label: resolveOffenceDescription(row.code, row.description),
});

const readTopStreetsGrouped = (
  sql: SqlStorage,
  limit: number
): { street: string; suburb: string; count: number }[] =>
  sql
    .exec<{ street: string; suburb: string; count: number }>(
      `SELECT street,
              ${STREET_SUBURB_EXPR} as suburb,
              count(*) as count
       FROM infringements
       WHERE street != '' AND street != 'Unknown'
       GROUP BY street, ${STREET_SUBURB_EXPR}
       ORDER BY count DESC
       LIMIT ?`,
      limit
    )
    .toArray();

const readTopOffencesGrouped = (
  sql: SqlStorage,
  limit: number,
  fromIso?: string
): {
  code: string;
  description: string;
  count: number;
  total_cents: number;
}[] => {
  if (fromIso === undefined) {
    return sql
      .exec<{
        code: string;
        description: string;
        count: number;
        total_cents: number;
      }>(
        `SELECT offence_code as code,
                min(offence_description) as description,
                count(*) as count,
                coalesce(sum(amount_cents), 0) as total_cents
         FROM infringements
         WHERE offence_code IS NOT NULL AND trim(offence_code) != ''
         GROUP BY offence_code
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();
  }

  return sql
    .exec<{
      code: string;
      description: string;
      count: number;
      total_cents: number;
    }>(
      `SELECT offence_code as code,
              min(offence_description) as description,
              count(*) as count,
              coalesce(sum(amount_cents), 0) as total_cents
       FROM infringements
       WHERE offence_code IS NOT NULL
         AND trim(offence_code) != ''
         AND occurred_at >= ?
       GROUP BY offence_code
       ORDER BY count DESC
       LIMIT ?`,
      fromIso,
      limit
    )
    .toArray();
};

export const getTopStats = (
  sql: SqlStorage,
  groupBy: TopGroupBy,
  window: TopWindow,
  limit: number
): TopStatRow[] => {
  const startDate =
    window === "all"
      ? null
      : formatDateInAuckland(subDays(new Date(), window === "7d" ? 7 : 30));

  if (groupBy === "street") {
    const rows =
      startDate === null
        ? sql
            .exec<{
              street: string;
              suburb: string;
              count: number;
              total_cents: number;
            }>(
              `SELECT street,
                      ${STREET_SUBURB_EXPR} as suburb,
                      count(*) as count,
                      coalesce(sum(amount_cents), 0) as total_cents
               FROM infringements
               WHERE street != '' AND street != 'Unknown'
               GROUP BY street, ${STREET_SUBURB_EXPR}
               ORDER BY count DESC
               LIMIT ?`,
              limit
            )
            .toArray()
        : sql
            .exec<{
              street: string;
              suburb: string;
              count: number;
              total_cents: number;
            }>(
              `SELECT street,
                      ${STREET_SUBURB_EXPR} as suburb,
                      count(*) as count,
                      coalesce(sum(amount_cents), 0) as total_cents
               FROM infringements
               WHERE street != '' AND street != 'Unknown' AND occurred_at >= ?
               GROUP BY street, ${STREET_SUBURB_EXPR}
               ORDER BY count DESC
               LIMIT ?`,
              startOfDayInAucklandIso(startDate),
              limit
            )
            .toArray();

    return rows.map((row) => ({
      count: row.count,
      key: formatStreetSuburb(row.street, row.suburb),
      totalCents: row.total_cents,
    }));
  }

  if (groupBy === "offence") {
    const rows =
      startDate === null
        ? readTopOffencesGrouped(sql, limit)
        : readTopOffencesGrouped(
            sql,
            limit,
            startOfDayInAucklandIso(startDate)
          );

    return rows.map((row) => ({
      count: row.count,
      key: resolveOffenceDescription(row.code, row.description),
      totalCents: row.total_cents,
    }));
  }

  return [];
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
): PublicTopItem[] => {
  if (groupBy === "street") {
    return readTopStreetsGrouped(sql, limit).map(toStreetTopItem);
  }

  return getTopStats(sql, groupBy, "all", limit).map((row) => ({
    count: row.count,
    label: row.key.trim(),
  }));
};

export const getTopStreets = (
  sql: SqlStorage,
  limit: number
): LocationRankItem[] =>
  readTopStreetsGrouped(sql, limit).map(toStreetLocationRankItem);

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
  if (groupBy === "street") {
    return readTopStreetsGrouped(sql, limit).map(toStreetTopItem);
  }

  return readTopOffencesGrouped(sql, limit).map(toOffenceTopItem);
};

export const readTopStreetsRanked = (
  sql: SqlStorage,
  limit: number
): LocationRankItem[] =>
  readTopStreetsGrouped(sql, limit).map(toStreetLocationRankItem);

export const readTopSuburbsRanked = (
  sql: SqlStorage,
  limit: number
): LocationRankItem[] => getTopSuburbs(sql, limit);

export const readTopVehicles = (
  sql: SqlStorage,
  limit: number
): VehicleRankItem[] => getTopVehicles(sql, limit);

const readGroupedLabelCounts = (
  sql: SqlStorage,
  query: string
): PublicTopItem[] =>
  sql
    .exec<{ label: string; count: number }>(query)
    .toArray()
    .map((row) => ({
      count: row.count,
      label: row.label,
    }));

export interface ChartBreakdown {
  offenceCategories: PublicTopItem[];
  offences: PublicTopItem[];
  suburbs: PublicTopItem[];
  towed: PublicTopItem[];
  vehicleMakes: PublicTopItem[];
  vehicleTypes: PublicTopItem[];
}

export const readChartBreakdown = (sql: SqlStorage): ChartBreakdown => ({
  offenceCategories: readGroupedLabelCounts(
    sql,
    `SELECT coalesce(nullif(trim(offence_category), ''), 'Uncategorised') as label,
            count(*) as count
     FROM infringements
     GROUP BY coalesce(nullif(trim(offence_category), ''), 'Uncategorised')
     ORDER BY count DESC`
  ),
  offences: readTopOffencesGrouped(sql, 10_000).map(toOffenceTopItem),
  suburbs: getTopSuburbs(sql, 10_000).map((row) => ({
    count: row.count,
    label: row.label,
  })),
  towed: readGroupedLabelCounts(
    sql,
    `SELECT CASE WHEN is_towed = 1 THEN 'Towed' ELSE 'Not towed' END as label,
            count(*) as count
     FROM infringements
     GROUP BY is_towed
     ORDER BY count DESC`
  ),
  vehicleMakes: readGroupedLabelCounts(
    sql,
    `SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') as label,
            count(*) as count
     FROM infringements
     GROUP BY coalesce(nullif(trim(vehicle_make), ''), 'Unknown')
     ORDER BY count DESC`
  ),
  vehicleTypes: readGroupedLabelCounts(
    sql,
    `SELECT coalesce(nullif(trim(vehicle_type), ''), 'Unknown') as label,
            count(*) as count
     FROM infringements
     GROUP BY coalesce(nullif(trim(vehicle_type), ''), 'Unknown')
     ORDER BY count DESC`
  ),
});
