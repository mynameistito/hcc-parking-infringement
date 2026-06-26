import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";

import { useLiveSocket } from "@/client/use-live-socket";
import { Dashboard } from "@/components/dashboard";
import type {
  DashboardConnectionStatus,
  DashboardDataStatus,
} from "@/components/dashboard";
import { EMPTY_CHART_BREAKDOWNS } from "@/contracts/public-api";
import type {
  ChartBreakdowns,
  DailyStatPoint,
  InfringementListResponse,
  PublicLiveStats,
  LocationRankItem,
  MapResponse,
  TopStatsResponse,
  VehicleRankItem,
} from "@/contracts/public-api";
import type { PaceTrends } from "@/lib/trend-window";

const EMPTY_LIVE: PublicLiveStats = {
  allTimeAmountCents: 0,
  allTimeTotal: 0,
  last24h: 0,
  last30d: 0,
  last365d: 0,
  last7d: 0,
  lastRecordAt: null,
  lastSyncedAt: null,
  thisMonth: 0,
  today: 0,
  towedToday: 0,
};

const useDashboardCache = <TData,>(
  queryKey: readonly unknown[]
): UseQueryResult<TData> =>
  useQuery<TData>({
    enabled: false,
    gcTime: Number.POSITIVE_INFINITY,
    queryFn: (): TData => {
      throw new Error("Dashboard data is delivered over WebSocket");
    },
    queryKey,
    staleTime: Number.POSITIVE_INFINITY,
  });

const resolveConnectionStatus = (
  connected: boolean,
  cached: boolean
): DashboardConnectionStatus => {
  if (connected && !cached) {
    return "live";
  }
  if (cached) {
    return "cached";
  }
  return "connecting";
};

const resolveDataStatus = (
  ready: boolean,
  connected: boolean,
  cached: boolean
): DashboardDataStatus => {
  if (!ready) {
    return "loading";
  }
  if (connected && cached) {
    return "updating";
  }
  return "ready";
};

export const App = () => {
  const { cached, connected, ready } = useLiveSocket();

  const { data: liveData } = useDashboardCache<PublicLiveStats>([
    "public",
    "live",
  ]);
  const { data: dailyTrendData } = useDashboardCache<DailyStatPoint[]>([
    "public",
    "stats",
    "daily",
  ]);
  const dailyTrend = dailyTrendData ?? [];
  const { data: paceTrendsData } = useDashboardCache<PaceTrends | undefined>([
    "public",
    "pace",
    "trends",
  ]);
  const { data: streetsData } = useDashboardCache<TopStatsResponse>([
    "public",
    "top",
    "street",
  ]);
  const { data: topStreetsData } = useDashboardCache<LocationRankItem[]>([
    "public",
    "locations",
    "streets",
  ]);
  const { data: topSuburbsData } = useDashboardCache<LocationRankItem[]>([
    "public",
    "locations",
    "suburbs",
  ]);
  const { data: topVehiclesData } = useDashboardCache<VehicleRankItem[]>([
    "public",
    "vehicles",
    "top",
  ]);
  const { data: mapData } = useDashboardCache<MapResponse>([
    "public",
    "locations",
    "map",
  ]);
  const { data: recentData } = useDashboardCache<InfringementListResponse>([
    "public",
    "infringements",
    "recent",
  ]);
  const { data: chartBreakdownsData } = useDashboardCache<ChartBreakdowns>([
    "public",
    "chart",
    "breakdowns",
  ]);

  const connectionStatus = resolveConnectionStatus(connected, cached);
  const dataStatus = resolveDataStatus(ready, connected, cached);

  return (
    <Dashboard
      live={liveData ?? EMPTY_LIVE}
      dailyTrend={dailyTrend}
      paceTrends={paceTrendsData}
      chartBreakdowns={chartBreakdownsData ?? EMPTY_CHART_BREAKDOWNS}
      streets={streetsData?.items ?? []}
      topStreets={topStreetsData ?? []}
      topSuburbs={topSuburbsData ?? []}
      topVehicles={topVehiclesData ?? []}
      recentInfringements={recentData?.data ?? []}
      mapRoutes={mapData?.routes ?? []}
      pendingGeocode={mapData?.pendingGeocode ?? 0}
      connectionStatus={connectionStatus}
      dataStatus={dataStatus}
      error={null}
    />
  );
};
