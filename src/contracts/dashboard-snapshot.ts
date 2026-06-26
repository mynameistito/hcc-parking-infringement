import { normalizeLocationGeometry } from "@/durable-objects/geometry.ts";
import type {
  PublicDashboardSnapshot,
  PublicPaceTrends,
} from "@/durable-objects/types/dashboard.ts";

import { fullDashboardMessageSchema } from "./public-api.ts";
import type { FullDashboardMessage } from "./public-api.ts";

const EMPTY_PACE_TRENDS: PublicPaceTrends = {
  last30d: { current: 0, direction: "flat", percent: 0, previous: 0 },
  last365d: { current: 0, direction: "flat", percent: 0, previous: 0 },
  last7d: { current: 0, direction: "flat", percent: 0, previous: 0 },
};

/** Parse an unknown value into a validated full-dashboard WebSocket message. */
export const parseFullDashboardMessage = (
  input: unknown
): FullDashboardMessage | null => {
  const parsed = fullDashboardMessageSchema.safeParse(input);
  if (!parsed.success) {
    return null;
  }

  return {
    ...parsed.data,
    dailyTrend: parsed.data.dailyTrend ?? [],
  };
};

/** Parse a JSON string into a validated full-dashboard message. */
export const parseFullDashboardMessageJson = (
  json: string
): FullDashboardMessage | null => {
  try {
    const input: unknown = JSON.parse(json);
    return parseFullDashboardMessage(input);
  } catch {
    return null;
  }
};

/** Map a validated message into the internal dashboard snapshot shape. */
export const toPublicDashboardSnapshot = (
  message: FullDashboardMessage
): PublicDashboardSnapshot => ({
  at: message.at,
  dailyTrend: message.dailyTrend ?? [],
  live: message.live,
  map: {
    pendingGeocode: message.map.pendingGeocode,
    routes: message.map.routes.map((route) => ({
      ...route,
      geometry: normalizeLocationGeometry(route.geometry),
    })),
  },
  paceTrends: message.paceTrends ?? EMPTY_PACE_TRENDS,
  recentInfringements: message.recentInfringements,
  streets: message.streets,
  suburbs: message.suburbs,
  topOffences: message.topOffences,
  topStreets: message.topStreets,
  vehicles: message.vehicles,
});

/** Parse JSON into the internal dashboard snapshot shape. */
export const parsePublicDashboardSnapshotJson = (
  json: string
): PublicDashboardSnapshot | null => {
  const message = parseFullDashboardMessageJson(json);
  return message === null ? null : toPublicDashboardSnapshot(message);
};

/** Heuristic payload weight for choosing the richest cached snapshot. */
export const getDashboardSnapshotPayloadWeight = (
  message: FullDashboardMessage
): number =>
  message.recentInfringements.length +
  message.topStreets.length +
  message.topOffences.length +
  message.streets.length +
  message.suburbs.length +
  message.vehicles.length +
  message.map.routes.length;

export const getDashboardSnapshotPayloadWeightJson = (json: string): number => {
  const message = parseFullDashboardMessageJson(json);
  return message === null ? 0 : getDashboardSnapshotPayloadWeight(message);
};

/** Whether a snapshot has enough data for the full dashboard experience. */
export const dashboardSnapshotIsComplete = (
  message: FullDashboardMessage
): boolean => {
  const dailyTrend = message.dailyTrend ?? [];
  const { paceTrends } = message;
  return (
    dailyTrend.length > 0 &&
    paceTrends !== undefined &&
    paceTrends.last7d !== undefined &&
    paceTrends.last30d !== undefined &&
    paceTrends.last365d !== undefined
  );
};

export const dashboardSnapshotIsCompleteJson = (json: string): boolean => {
  const message = parseFullDashboardMessageJson(json);
  return message !== null && dashboardSnapshotIsComplete(message);
};
