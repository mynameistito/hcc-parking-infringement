import type {
  DailyStatRow,
  InfringementListResult,
  InfringementQuery,
  InfringementRow,
} from "@/durable-objects/types.ts";
import {
  endOfDayInAucklandIso,
  startOfDayInAucklandIso,
} from "@/lib/auckland-time.ts";

const buildInfringementWhere = (
  query: InfringementQuery
): { clause: string; params: (string | number)[] } => {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (query.from !== undefined && query.from !== "") {
    conditions.push("occurred_at >= ?");
    params.push(startOfDayInAucklandIso(query.from));
  }
  if (query.to !== undefined && query.to !== "") {
    conditions.push("occurred_at <= ?");
    params.push(endOfDayInAucklandIso(query.to));
  }
  if (query.street !== undefined && query.street !== "") {
    conditions.push("street = ?");
    params.push(query.street);
  }
  if (query.suburb !== undefined && query.suburb !== "") {
    if (query.suburb === "Unknown") {
      conditions.push("(suburb IS NULL OR suburb = '')");
    } else {
      conditions.push("suburb = ?");
      params.push(query.suburb);
    }
  }
  if (query.vehicleMake !== undefined && query.vehicleMake !== "") {
    conditions.push("coalesce(nullif(trim(vehicle_make), ''), 'Unknown') = ?");
    params.push(query.vehicleMake);
  }
  if (query.vehicleModel !== undefined) {
    conditions.push("coalesce(nullif(trim(vehicle_model), ''), '') = ?");
    params.push(query.vehicleModel);
  }

  const clause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { clause, params };
};

const mapInfringementRow = (row: {
  infringement_number: number;
  occurred_at: string;
  amount_cents: number;
  street: string;
  suburb: string | null;
  town: string | null;
  post_code: string | null;
  offence_code: string | null;
  offence_description: string;
  offence_category: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_colour: string | null;
  vehicle_type: string | null;
  is_towed: number;
  first_seen_at: string;
  updated_at: string;
}): InfringementRow => ({
  amountCents: row.amount_cents,
  firstSeenAt: row.first_seen_at,
  infringementNumber: row.infringement_number,
  isTowed: row.is_towed === 1,
  occurredAt: row.occurred_at,
  offenceCategory: row.offence_category,
  offenceCode: row.offence_code,
  offenceDescription: row.offence_description,
  postCode: row.post_code,
  street: row.street,
  suburb: row.suburb,
  town: row.town,
  updatedAt: row.updated_at,
  vehicleColour: row.vehicle_colour,
  vehicleMake: row.vehicle_make,
  vehicleModel: row.vehicle_model,
  vehicleType: row.vehicle_type,
});

export const listInfringements = (
  sql: SqlStorage,
  query: InfringementQuery
): InfringementListResult => {
  const { clause: whereClause, params } = buildInfringementWhere(query);
  const offset = (query.page - 1) * query.limit;

  const totalRow = sql
    .exec<{ total: number }>(
      `SELECT count(*) as total FROM infringements ${whereClause}`,
      ...params
    )
    .one();

  const rows = sql
    .exec<{
      infringement_number: number;
      occurred_at: string;
      amount_cents: number;
      street: string;
      suburb: string | null;
      town: string | null;
      post_code: string | null;
      offence_code: string | null;
      offence_description: string;
      offence_category: string | null;
      vehicle_make: string | null;
      vehicle_model: string | null;
      vehicle_colour: string | null;
      vehicle_type: string | null;
      is_towed: number;
      first_seen_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM infringements ${whereClause}
       ORDER BY occurred_at DESC
       LIMIT ? OFFSET ?`,
      ...params,
      query.limit,
      offset
    )
    .toArray();

  return {
    data: rows.map(mapInfringementRow),
    limit: query.limit,
    page: query.page,
    total: totalRow?.total ?? 0,
  };
};

export const getDailyStats = (
  sql: SqlStorage,
  from: string,
  to: string
): DailyStatRow[] => {
  const rows = sql
    .exec<{ date: string; count: number; amount_cents: number }>(
      `SELECT date, count, amount_cents FROM daily_counts
       WHERE date >= ? AND date <= ?
       ORDER BY date`,
      from,
      to
    )
    .toArray();

  return rows.map((row) => ({
    count: row.count,
    date: row.date,
    totalCents: row.amount_cents,
  }));
};

export const countInfringements = (sql: SqlStorage): number => {
  const totalRow = sql
    .exec<{ total: number }>("SELECT count(*) as total FROM infringements")
    .one();

  return totalRow?.total ?? 0;
};
