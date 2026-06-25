import { useQuery } from "@tanstack/react-query";

import { Dashboard } from "@/components/dashboard";

import {
  fetchLiveStats,
  fetchMapPoints,
  fetchRecentInfringements,
  fetchTopStats,
  fetchTopStreets,
  fetchTopSuburbs,
  fetchTopVehicles,
} from "./api";
import { useLiveSocket } from "./use-live-socket";

const FALLBACK_POLL_MS = 15_000;

const EMPTY_LIVE = {
  allTimeAmountCents: 0,
  allTimeTotal: 0,
  last24h: 0,
  last30d: 0,
  last7d: 0,
  lastRecordAt: null,
  lastSyncedAt: null,
  thisMonth: 0,
  today: 0,
  towedToday: 0,
};

const getQueryErrorMessage = (
  errors: ({ message?: string } | null | undefined)[]
): string | null => {
  for (const error of errors) {
    if (error?.message !== undefined && error.message.length > 0) {
      return error.message;
    }
  }
  return null;
};

const isAnyQueryFetching = (flags: boolean[]): boolean => flags.some(Boolean);

export const App = () => {
  const isLive = useLiveSocket();
  const pollInterval = isLive ? false : FALLBACK_POLL_MS;

  const liveQuery = useQuery({
    queryFn: fetchLiveStats,
    queryKey: ["public", "live"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const streetsQuery = useQuery({
    queryFn: async () => await fetchTopStats("street", 5),
    queryKey: ["public", "top", "street"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const offencesQuery = useQuery({
    queryFn: async () => await fetchTopStats("offence", 5),
    queryKey: ["public", "top", "offence"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const topStreetsQuery = useQuery({
    queryFn: async () => await fetchTopStreets(10),
    queryKey: ["public", "locations", "streets"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const topSuburbsQuery = useQuery({
    queryFn: async () => await fetchTopSuburbs(10),
    queryKey: ["public", "locations", "suburbs"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const topVehiclesQuery = useQuery({
    queryFn: async () => await fetchTopVehicles(10),
    queryKey: ["public", "vehicles", "top"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const mapQuery = useQuery({
    queryFn: async () => await fetchMapPoints(50),
    queryKey: ["public", "locations", "map"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const recentQuery = useQuery({
    queryFn: async () => await fetchRecentInfringements(15),
    queryKey: ["public", "infringements", "recent"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const error = getQueryErrorMessage([
    liveQuery.error,
    streetsQuery.error,
    offencesQuery.error,
    topStreetsQuery.error,
    topSuburbsQuery.error,
    topVehiclesQuery.error,
    mapQuery.error,
    recentQuery.error,
  ]);

  const isFetching =
    !isLive &&
    isAnyQueryFetching([
      liveQuery.isFetching,
      streetsQuery.isFetching,
      offencesQuery.isFetching,
      topStreetsQuery.isFetching,
      topSuburbsQuery.isFetching,
      topVehiclesQuery.isFetching,
      mapQuery.isFetching,
      recentQuery.isFetching,
    ]);

  return (
    <Dashboard
      live={liveQuery.data ?? EMPTY_LIVE}
      streets={streetsQuery.data?.items ?? []}
      offences={offencesQuery.data?.items ?? []}
      topStreets={topStreetsQuery.data ?? []}
      topSuburbs={topSuburbsQuery.data ?? []}
      topVehicles={topVehiclesQuery.data ?? []}
      recentInfringements={recentQuery.data?.data ?? []}
      mapRoutes={mapQuery.data?.routes ?? []}
      pendingGeocode={mapQuery.data?.pendingGeocode ?? 0}
      isLive={isLive}
      isFetching={isFetching}
      error={error}
    />
  );
};
