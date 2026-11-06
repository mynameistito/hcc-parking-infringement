import { normalizeLocationGeometry } from "@/durable-objects/geometry.ts";
import type {
  PublicDashboardSnapshot,
  PublicPaceTrends,
} from "@/durable-objects/types/dashboard.ts";
import {
  chartBreakdownsFullyPopulated,
  resolveChartBreakdowns,
} from "@/lib/chart-breakdowns.ts";

import { fullDashboardMessageSchema } from "./public-api.ts";
import type { FullDashboardMessage } from "./public-api.ts";

const EMPTY_PACE_TRENDS: PublicPaceTrends = {
  last30d: { current: 0, direction: "flat", percent: 0, previous: 0 },
  last365d: { current: 0, direction: "flat", percent: 0, previous: 0 },
  last7d: { current: 0, direction: "flat", percent: 0, previous: 0 },
};

/**
 * Parses a WebSocket payload without synthesizing chart breakdowns.
 * @param input - The untrusted payload to validate.
 * @returns A validated message, or null when validation fails.
 */
const parseRawFullDashboardMessage = (
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- The WebSocket boundary is untrusted and safeParse validates this value immediately.
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

/** Parse an unknown value into a validated full-dashboard WebSocket message. */
export const parseFullDashboardMessage = parseRawFullDashboardMessage;

/**
 * Parses JSON into a validated full-dashboard message.
 * @param json - The serialized message.
 * @returns The validated message, or null when parsing or validation fails.
 */
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

/**
 * Parses JSON without enriching chart breakdowns for completeness checks.
 * @param json - The serialized message.
 * @returns The validated raw message, or null when parsing or validation fails.
 */
export const parseRawFullDashboardMessageJson = (
  json: string
): FullDashboardMessage | null => {
  try {
    const input: unknown = JSON.parse(json);

    return parseRawFullDashboardMessage(input);
  } catch {
    return null;
  }
};

/**
 * Maps a validated message into the internal dashboard snapshot shape.
 * @param message - The validated full-dashboard message.
 * @returns The normalized public snapshot.
 */
const toPublicDashboardSnapshot = (
  message: FullDashboardMessage
): PublicDashboardSnapshot => ({
  at: message.at,
  chartBreakdowns: resolveChartBreakdowns(message),
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

/**
 * Parses JSON into the internal dashboard snapshot shape.
 * @param json - The serialized message.
 * @returns The normalized snapshot, or null when parsing or validation fails.
 */
export const parsePublicDashboardSnapshotJson = (
  json: string
): PublicDashboardSnapshot | null => {
  const message = parseFullDashboardMessageJson(json);

  return message === null ? null : toPublicDashboardSnapshot(message);
};

/**
 * Calculates a heuristic payload weight for comparing cached snapshots.
 * @param message - The validated full-dashboard message.
 * @returns The sum of selected collection lengths.
 */
export const getDashboardSnapshotPayloadWeight = (
  message: FullDashboardMessage
): number => {
  const breakdowns = resolveChartBreakdowns(message);

  return (
    message.recentInfringements.length +
    message.topStreets.length +
    message.topOffences.length +
    message.streets.length +
    message.suburbs.length +
    message.vehicles.length +
    message.map.routes.length +
    breakdowns.offences.length
  );
};

/**
 * Calculates a snapshot payload weight from JSON.
 * @param json - The serialized message.
 * @returns The payload weight, or zero for invalid JSON or messages.
 */
export const getDashboardSnapshotPayloadWeightJson = (json: string): number => {
  const message = parseFullDashboardMessageJson(json);

  return message === null ? 0 : getDashboardSnapshotPayloadWeight(message);
};

/**
 * Checks whether a snapshot contains the required full-dashboard data.
 * @param message - The validated full-dashboard message.
 * @returns Whether the required trend, pace, and chart data is present.
 */
export const dashboardSnapshotIsComplete = (
  message: FullDashboardMessage
): boolean => {
  const dailyTrend = message.dailyTrend ?? [];
  const { paceTrends } = message;

  if (dailyTrend.length === 0 || paceTrends === undefined) {
    return false;
  }

  if (
    paceTrends.last7d === undefined ||
    paceTrends.last30d === undefined ||
    paceTrends.last365d === undefined
  ) {
    return false;
  }

  return (
    message.live.allTimeTotal === 0 ||
    chartBreakdownsFullyPopulated(message.chartBreakdowns)
  );
};

/**
 * Checks whether a serialized snapshot contains the required dashboard data.
 * @param json - The serialized message.
 * @returns Whether the JSON is valid and the snapshot is complete.
 */
export const dashboardSnapshotIsCompleteJson = (json: string): boolean => {
  const message = parseRawFullDashboardMessageJson(json);

  return message !== null && dashboardSnapshotIsComplete(message);
};
