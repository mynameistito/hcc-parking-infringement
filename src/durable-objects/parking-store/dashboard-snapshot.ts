import type {
  PublicDashboardSnapshot,
  PublicLiveStats,
  PublicPaceTrends,
} from "@/durable-objects/types.ts";

export const getDashboardSnapshotPayloadWeight = (payload: string): number => {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed !== "object" || parsed === null) {
      return 0;
    }

    const snapshot = parsed as {
      map?: { routes?: unknown[] };
      recentInfringements?: unknown[];
      streets?: unknown[];
      suburbs?: unknown[];
      topOffences?: unknown[];
      topStreets?: unknown[];
      vehicles?: unknown[];
    };

    return (
      (snapshot.recentInfringements?.length ?? 0) +
      (snapshot.topStreets?.length ?? 0) +
      (snapshot.topOffences?.length ?? 0) +
      (snapshot.streets?.length ?? 0) +
      (snapshot.suburbs?.length ?? 0) +
      (snapshot.vehicles?.length ?? 0) +
      (snapshot.map?.routes?.length ?? 0)
    );
  } catch {
    return 0;
  }
};

export const snapshotIsComplete = (payload: string): boolean => {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed !== "object" || parsed === null) {
      return false;
    }
    const dailyTrend: unknown = Reflect.get(parsed, "dailyTrend");
    const paceTrends: unknown = Reflect.get(parsed, "paceTrends");
    return (
      Array.isArray(dailyTrend) &&
      dailyTrend.length > 0 &&
      typeof paceTrends === "object" &&
      paceTrends !== null &&
      Reflect.get(paceTrends, "last7d") !== undefined &&
      Reflect.get(paceTrends, "last30d") !== undefined &&
      Reflect.get(paceTrends, "last365d") !== undefined
    );
  } catch {
    return false;
  }
};

export const buildColdDashboardSnapshotPayload = (
  live: PublicLiveStats,
  paceTrends: PublicPaceTrends,
  at: string
): string =>
  JSON.stringify({
    at,
    dailyTrend: [],
    live,
    map: {
      pendingGeocode: 0,
      routes: [],
    },
    paceTrends,
    recentInfringements: [],
    streets: [],
    suburbs: [],
    topOffences: [],
    topStreets: [],
    type: "full",
    vehicles: [],
  });

export const buildFullDashboardSnapshotPayload = (
  snapshot: PublicDashboardSnapshot
): string => JSON.stringify({ type: "full", ...snapshot });
