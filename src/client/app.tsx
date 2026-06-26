import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";

import { useLiveSocket } from "@/client/use-live-socket";
import { Dashboard } from "@/components/dashboard";
import type {
  DailyStatPoint,
  InfringementListResponse,
  LiveStats,
  LocationRankItem,
  MapResponse,
  TopStatsResponse,
  VehicleRankItem,
} from "@/contracts/public-api";
import type { PaceTrends } from "@/lib/trend-window";

const EMPTY_LIVE: LiveStats = {
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

export const App = () => {
  const { cached, connected, ready } = useLiveSocket();

  const { data: liveData } = useDashboardCache<LiveStats>(["public", "live"]);
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
  const { data: offencesData } = useDashboardCache<TopStatsResponse>([
    "public",
    "top",
    "offence",
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

  return (
    <Dashboard
      live={liveData ?? EMPTY_LIVE}
      dailyTrend={dailyTrend}
      paceTrends={paceTrendsData}
      streets={streetsData?.items ?? []}
      offences={offencesData?.items ?? []}
      topStreets={topStreetsData ?? []}
      topSuburbs={topSuburbsData ?? []}
      topVehicles={topVehiclesData ?? []}
      recentInfringements={recentData?.data ?? []}
      mapRoutes={mapData?.routes ?? []}
      pendingGeocode={mapData?.pendingGeocode ?? 0}
      isCached={cached}
      isLive={connected && !cached}
      isFetching={ready && connected && cached}
      isLoading={!ready}
      error={null}
    />
  );
};
