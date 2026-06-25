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

  const {
    data: liveData,
    error: liveError,
    isFetching: liveIsFetching,
  } = useQuery({
    queryFn: fetchLiveStats,
    queryKey: ["public", "live"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const {
    data: streetsData,
    error: streetsError,
    isFetching: streetsIsFetching,
  } = useQuery({
    queryFn: async () => await fetchTopStats("street", 5),
    queryKey: ["public", "top", "street"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const {
    data: offencesData,
    error: offencesError,
    isFetching: offencesIsFetching,
  } = useQuery({
    queryFn: async () => await fetchTopStats("offence", 5),
    queryKey: ["public", "top", "offence"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const {
    data: topStreetsData,
    error: topStreetsError,
    isFetching: topStreetsIsFetching,
  } = useQuery({
    queryFn: async () => await fetchTopStreets(10),
    queryKey: ["public", "locations", "streets"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const {
    data: topSuburbsData,
    error: topSuburbsError,
    isFetching: topSuburbsIsFetching,
  } = useQuery({
    queryFn: async () => await fetchTopSuburbs(10),
    queryKey: ["public", "locations", "suburbs"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const {
    data: topVehiclesData,
    error: topVehiclesError,
    isFetching: topVehiclesIsFetching,
  } = useQuery({
    queryFn: async () => await fetchTopVehicles(10),
    queryKey: ["public", "vehicles", "top"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const {
    data: mapData,
    error: mapError,
    isFetching: mapIsFetching,
  } = useQuery({
    queryFn: async () => await fetchMapPoints(50),
    queryKey: ["public", "locations", "map"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const {
    data: recentData,
    error: recentError,
    isFetching: recentIsFetching,
  } = useQuery({
    queryFn: async () => await fetchRecentInfringements(15),
    queryKey: ["public", "infringements", "recent"],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  const error = getQueryErrorMessage([
    liveError,
    streetsError,
    offencesError,
    topStreetsError,
    topSuburbsError,
    topVehiclesError,
    mapError,
    recentError,
  ]);

  const isFetching =
    !isLive &&
    isAnyQueryFetching([
      liveIsFetching,
      streetsIsFetching,
      offencesIsFetching,
      topStreetsIsFetching,
      topSuburbsIsFetching,
      topVehiclesIsFetching,
      mapIsFetching,
      recentIsFetching,
    ]);

  return (
    <Dashboard
      live={liveData ?? EMPTY_LIVE}
      streets={streetsData?.items ?? []}
      offences={offencesData?.items ?? []}
      topStreets={topStreetsData ?? []}
      topSuburbs={topSuburbsData ?? []}
      topVehicles={topVehiclesData ?? []}
      recentInfringements={recentData?.data ?? []}
      mapRoutes={mapData?.routes ?? []}
      pendingGeocode={mapData?.pendingGeocode ?? 0}
      isLive={isLive}
      isFetching={isFetching}
      error={error}
    />
  );
};
