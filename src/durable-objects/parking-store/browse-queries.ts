import type {
  BrowseQuery,
  BrowseResult,
  LocationRankItem,
  VehicleRankItem,
} from "@/durable-objects/types.ts";

const streetSuburbFilter = (
  suburb: string | undefined | null
): { clause: string; params: string[] } => {
  if (suburb === undefined || suburb === null || suburb === "") {
    return { clause: "", params: [] };
  }

  if (suburb === "Unknown") {
    return { clause: "AND (suburb IS NULL OR trim(suburb) = '')", params: [] };
  }

  return { clause: "AND suburb = ?", params: [suburb] };
};

export const browseSuburbs = (
  sql: SqlStorage,
  query: BrowseQuery
): BrowseResult<LocationRankItem> => {
  const q = query.q?.trim() ?? "";
  const pattern = `%${q}%`;
  const offset = (query.page - 1) * query.limit;
  const orderBy =
    query.sort === "name" ? "label COLLATE NOCASE ASC" : "count DESC";

  const totalRow = sql
    .exec<{ total: number }>(
      `WITH grouped AS (
         SELECT coalesce(nullif(trim(suburb), ''), 'Unknown') AS label,
                count(*) AS count
         FROM infringements
         GROUP BY coalesce(nullif(trim(suburb), ''), 'Unknown')
       )
       SELECT count(*) AS total
       FROM grouped
       WHERE (? = '' OR lower(label) LIKE lower(?))`,
      q,
      pattern
    )
    .one();

  const rows = sql
    .exec<{ label: string; count: number }>(
      `WITH grouped AS (
         SELECT coalesce(nullif(trim(suburb), ''), 'Unknown') AS label,
                count(*) AS count
         FROM infringements
         GROUP BY coalesce(nullif(trim(suburb), ''), 'Unknown')
       )
       SELECT label, count
       FROM grouped
       WHERE (? = '' OR lower(label) LIKE lower(?))
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      q,
      pattern,
      query.limit,
      offset
    )
    .toArray();

  return {
    items: rows.map((row) => ({
      count: row.count,
      label: row.label,
      suburb: row.label,
    })),
    limit: query.limit,
    page: query.page,
    total: totalRow?.total ?? 0,
  };
};

export const browseStreets = (
  sql: SqlStorage,
  query: BrowseQuery
): BrowseResult<LocationRankItem> => {
  const q = query.q?.trim() ?? "";
  const pattern = `%${q}%`;
  const offset = (query.page - 1) * query.limit;
  const orderBy =
    query.sort === "name" ? "street COLLATE NOCASE ASC" : "count DESC";
  const { clause: suburbFilter, params: suburbParams } = streetSuburbFilter(
    query.suburb
  );

  const totalRow = sql
    .exec<{ total: number }>(
      `WITH grouped AS (
         SELECT street,
                coalesce(nullif(trim(suburb), ''), 'Unknown') AS suburb,
                count(*) AS count
         FROM infringements
         WHERE street != '' AND street != 'Unknown'
           ${suburbFilter}
         GROUP BY street, coalesce(nullif(trim(suburb), ''), 'Unknown')
       )
       SELECT count(*) AS total
       FROM grouped
       WHERE (? = '' OR lower(street) LIKE lower(?) OR lower(suburb) LIKE lower(?))`,
      ...suburbParams,
      q,
      pattern,
      pattern
    )
    .one();

  const rows = sql
    .exec<{ street: string; suburb: string; count: number }>(
      `WITH grouped AS (
         SELECT street,
                coalesce(nullif(trim(suburb), ''), 'Unknown') AS suburb,
                count(*) AS count
         FROM infringements
         WHERE street != '' AND street != 'Unknown'
           ${suburbFilter}
         GROUP BY street, coalesce(nullif(trim(suburb), ''), 'Unknown')
       )
       SELECT street, suburb, count
       FROM grouped
       WHERE (? = '' OR lower(street) LIKE lower(?) OR lower(suburb) LIKE lower(?))
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      ...suburbParams,
      q,
      pattern,
      pattern,
      query.limit,
      offset
    )
    .toArray();

  return {
    items: rows.map((row) => ({
      count: row.count,
      label:
        row.suburb === "Unknown" ? row.street : `${row.street} · ${row.suburb}`,
      street: row.street,
      suburb: row.suburb,
    })),
    limit: query.limit,
    page: query.page,
    total: totalRow?.total ?? 0,
  };
};

export const browseVehicles = (
  sql: SqlStorage,
  query: BrowseQuery
): BrowseResult<VehicleRankItem> => {
  const q = query.q?.trim() ?? "";
  const pattern = `%${q}%`;
  const offset = (query.page - 1) * query.limit;
  const orderBy =
    query.sort === "name"
      ? "make COLLATE NOCASE ASC, model COLLATE NOCASE ASC"
      : "count DESC";

  const totalRow = sql
    .exec<{ total: number }>(
      `WITH grouped AS (
         SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') AS make,
                coalesce(nullif(trim(vehicle_model), ''), '') AS model,
                count(*) AS count
         FROM infringements
         WHERE (vehicle_make IS NOT NULL AND trim(vehicle_make) != '')
            OR (vehicle_model IS NOT NULL AND trim(vehicle_model) != '')
         GROUP BY vehicle_make, vehicle_model
       )
       SELECT count(*) AS total
       FROM grouped
       WHERE (? = '' OR lower(make) LIKE lower(?) OR lower(model) LIKE lower(?))`,
      q,
      pattern,
      pattern
    )
    .one();

  const rows = sql
    .exec<{ make: string; model: string; count: number }>(
      `WITH grouped AS (
         SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') AS make,
                coalesce(nullif(trim(vehicle_model), ''), '') AS model,
                count(*) AS count
         FROM infringements
         WHERE (vehicle_make IS NOT NULL AND trim(vehicle_make) != '')
            OR (vehicle_model IS NOT NULL AND trim(vehicle_model) != '')
         GROUP BY vehicle_make, vehicle_model
       )
       SELECT make, model, count
       FROM grouped
       WHERE (? = '' OR lower(make) LIKE lower(?) OR lower(model) LIKE lower(?))
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      q,
      pattern,
      pattern,
      query.limit,
      offset
    )
    .toArray();

  return {
    items: rows.map((row) => ({
      count: row.count,
      label: row.model ? `${row.make} ${row.model}` : row.make,
      make: row.make,
      model: row.model,
    })),
    limit: query.limit,
    page: query.page,
    total: totalRow?.total ?? 0,
  };
};
