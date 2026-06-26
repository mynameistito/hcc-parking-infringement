import type { PublicInfringement } from "@/contracts/public-api.ts";
import type { TrendResult } from "@/lib/trend.ts";

import type {
  LocationRankItem,
  PublicTopItem,
  VehicleRankItem,
} from "./browse.ts";
import type { LocationMapPoint } from "./locations.ts";
import type { DailyStatRow, PublicLiveStats } from "./stats.ts";

export interface ChartBreakdown {
  offenceCategories: PublicTopItem[];
  offences: PublicTopItem[];
  suburbs: PublicTopItem[];
  towed: PublicTopItem[];
  vehicleMakes: PublicTopItem[];
  vehicleTypes: PublicTopItem[];
}

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
  recentInfringements: PublicInfringement[];
  topStreets: PublicTopItem[];
  topOffences: PublicTopItem[];
  streets: LocationRankItem[];
  suburbs: LocationRankItem[];
  vehicles: VehicleRankItem[];
  chartBreakdowns: ChartBreakdown;
  map: {
    routes: LocationMapPoint[];
    pendingGeocode: number;
  };
}
