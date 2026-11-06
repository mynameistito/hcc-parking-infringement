import type { QueryClient } from "@tanstack/react-query";

import { parseFullDashboardMessageJson } from "@/contracts/dashboard-snapshot.ts";
import type { FullDashboardMessage } from "@/contracts/public-api";
import { parseAucklandInstant } from "@/lib/auckland-time";
import {
  resolveChartBreakdowns,
  resolveChartStreetItems,
} from "@/lib/chart-breakdowns";
import { resolveOffenceDescription } from "@/lib/offence-catalog";

export type { FullDashboardMessage } from "@/contracts/public-api";

/**
 * Parse a dashboard socket message into a full snapshot.
 * @param data - Serialized dashboard message.
 * @returns The resulting `FullDashboardMessage | null` value.
 */
export const parseDashboardMessage = (
  data: string
): FullDashboardMessage | null => parseFullDashboardMessageJson(data);

/**
 * Read the timestamp used to order dashboard snapshots.
 * @param message - Validated dashboard snapshot.
 * @returns The computed numeric value.
 */
export const getDashboardSnapshotTime = (
  message: FullDashboardMessage
): number => {
  const source = message.live.lastSyncedAt ?? message.at;

  try {
    return parseAucklandInstant(source).getTime();
  } catch {
    return 0;
  }
};

export {
  persistDashboardSnapshot,
  readPersistedDashboardSnapshot,
  readPersistedDashboardSnapshotSync,
} from "@/client/dashboard-snapshot-storage";

const resolvePublicOffenceDescription = (description: string): string =>
  resolveOffenceDescription(undefined, description);

/**
 * Update dashboard queries from a validated full snapshot.
 * @param queryClient - Dashboard query cache.
 * @param message - Validated dashboard snapshot.
 */
export const applyDashboardSnapshot = (
  queryClient: QueryClient,
  message: FullDashboardMessage
): void => {
  const chartBreakdowns = resolveChartBreakdowns(message);
  const streetChartItems = resolveChartStreetItems(message);

  queryClient.setQueryData(["public", "live"], message.live);
  queryClient.setQueryData(["public", "chart", "breakdowns"], chartBreakdowns);
  queryClient.setQueryData(
    ["public", "stats", "daily"],
    message.dailyTrend ?? []
  );

  if (message.paceTrends !== undefined) {
    queryClient.setQueryData(["public", "pace", "trends"], message.paceTrends);
  }

  queryClient.setQueryData(["public", "top", "street"], {
    groupBy: "street",
    items: streetChartItems,
  });
  queryClient.setQueryData(["public", "top", "offence"], {
    groupBy: "offence",
    items: chartBreakdowns.offences.map((item) => ({
      ...item,
      label: resolvePublicOffenceDescription(item.label),
    })),
  });
  queryClient.setQueryData(["public", "locations", "streets"], message.streets);
  queryClient.setQueryData(["public", "locations", "suburbs"], message.suburbs);
  queryClient.setQueryData(["public", "vehicles", "top"], message.vehicles);
  queryClient.setQueryData(["public", "locations", "map"], message.map);
  queryClient.setQueryData(["public", "infringements", "recent"], {
    data: message.recentInfringements.map((row) => ({
      ...row,
      offenceDescription: resolvePublicOffenceDescription(
        row.offenceDescription
      ),
    })),
    limit: message.recentInfringements.length,
    page: 1,
    total: message.live.allTimeTotal,
  });
};
