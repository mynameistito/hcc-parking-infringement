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

export interface LiveStats {
  today: { count: number; totalCents: number };
  thisMonth: { count: number; totalCents: number };
  thisYear: { count: number; totalCents: number };
  allTime: { count: number; totalCents: number };
  updatedAt: string | null;
}

export interface DailyStatRow {
  date: string;
  count: number;
  totalCents: number;
}

export type TopGroupBy = "street" | "offence";
export type TopWindow = "all" | "7d" | "30d";

export interface TopStatRow {
  key: string;
  count: number;
  totalCents: number;
}
