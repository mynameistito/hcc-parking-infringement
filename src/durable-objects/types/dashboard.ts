import type { TrendResult } from "@/lib/trend.ts";

import type {
  LocationRankItem,
  PublicTopItem,
  VehicleRankItem,
} from "./browse.ts";
import type { InfringementRow } from "./infringements.ts";
import type { LocationMapPoint } from "./locations.ts";
import type { DailyStatRow, PublicLiveStats } from "./stats.ts";

export interface PublicPaceTrends {
  last7d: TrendResult;
  last30d: TrendResult;
  last365d: TrendResult;
}

export interface PublicDashboardSnapshot {
  at: string;
  live: PublicLiveStats;
  dailyTrend: DailyStatRow[];
  paceTrends: PublicPaceTrends;
  recentInfringements: InfringementRow[];
  topStreets: PublicTopItem[];
  topOffences: PublicTopItem[];
  streets: LocationRankItem[];
  suburbs: LocationRankItem[];
  vehicles: VehicleRankItem[];
  map: {
    routes: LocationMapPoint[];
    pendingGeocode: number;
  };
}
