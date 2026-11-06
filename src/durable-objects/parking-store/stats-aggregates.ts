/** Infringement count and fine total for a period. */
interface PeriodAggregate {
  count: number;
  totalCents: number;
}

/** Infringement counts and fine totals for a time window. */
export interface WindowAggregate {
  amountCents: number;
  count: number;
  towedCount: number;
}

/**
 * Aggregates infringements within inclusive timestamp bounds.
 * @param sql - The Durable Object SQL storage.
 * @param start - Inclusive start timestamp.
 * @param end - Inclusive end timestamp.
 * @returns Record count, total fines, and towed count.
 */
export const aggregateWindow = (
  sql: SqlStorage,
  start: string,
  end: string
): WindowAggregate => {
  const row = sql
    .exec<{ count: number; amount_cents: number; towed_count: number }>(
      `SELECT count(*) as count,
              coalesce(sum(amount_cents), 0) as amount_cents,
              coalesce(sum(case when is_towed = 1 then 1 else 0 end), 0) as towed_count
       FROM infringements
       WHERE occurred_at >= ? AND occurred_at <= ?`,
      start,
      end
    )
    .one();

  return {
    amountCents: row?.amount_cents ?? 0,
    count: row?.count ?? 0,
    towedCount: row?.towed_count ?? 0,
  };
};

/**
 * Reads infringement count and fine total within inclusive timestamp bounds.
 * @param sql - The Durable Object SQL storage.
 * @param start - Inclusive start timestamp.
 * @param end - Inclusive end timestamp.
 * @returns Record count and total fines.
 */
export const aggregatePeriod = (
  sql: SqlStorage,
  start: string,
  end: string
): PeriodAggregate => {
  const row = aggregateWindow(sql, start, end);

  return { count: row.count, totalCents: row.amountCents };
};
