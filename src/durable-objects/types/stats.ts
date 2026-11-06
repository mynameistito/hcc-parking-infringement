/** Public dashboard counts and synchronization timestamps. */
export interface PublicLiveStats {
  allTimeTotal: number;
  allTimeAmountCents: number;
  today: number;
  last24h: number;
  last7d: number;
  last30d: number;
  last365d: number;
  thisMonth: number;
  towedToday: number;
  lastSyncedAt: string | null;
  lastRecordAt: string | null;
}

/** Internal period totals and their last update time. */
export interface LiveStats {
  today: { count: number; totalCents: number };
  thisMonth: { count: number; totalCents: number };
  thisYear: { count: number; totalCents: number };
  allTime: { count: number; totalCents: number };
  updatedAt: string | null;
}

/** Infringement count and amount for a calendar date. */
export interface DailyStatRow {
  date: string;
  count: number;
  totalCents: number;
}

/** Dimensions supported by top-stat rankings. */
export type TopGroupBy = "street" | "offence";

/** Time windows supported by top-stat rankings. */
export type TopWindow = "all" | "7d" | "30d";

/** A ranked key with its infringement count and total amount. */
export interface TopStatRow {
  key: string;
  count: number;
  totalCents: number;
}
