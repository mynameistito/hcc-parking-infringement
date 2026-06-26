import type { QueryClient } from "@tanstack/react-query";

import { fullDashboardMessageSchema } from "@/contracts/public-api";
import type { FullDashboardMessage } from "@/contracts/public-api";

export type { FullDashboardMessage };

export const parseDashboardMessage = (
  data: string
): FullDashboardMessage | null => {
  try {
    const parsed: unknown = JSON.parse(data);
    const message = fullDashboardMessageSchema.parse(parsed);
    return {
      ...message,
      dailyTrend: message.dailyTrend ?? [],
    };
  } catch {
    return null;
  }
};

export const getDashboardSnapshotTime = (
  message: FullDashboardMessage
): number => {
  const source = message.live.lastSyncedAt ?? message.at;
  const parsed = Date.parse(source);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export { getDashboardSnapshotWeight } from "@/client/dashboard-snapshot-storage";
export {
  persistDashboardSnapshot,
  readPersistedDashboardSnapshot,
  readPersistedDashboardSnapshotSync,
} from "@/client/dashboard-snapshot-storage";

export const applyDashboardSnapshot = (
  queryClient: QueryClient,
  message: FullDashboardMessage
): void => {
  queryClient.setQueryData(["public", "live"], message.live);
  queryClient.setQueryData(["public", "stats", "daily"], message.dailyTrend);
  if (message.paceTrends !== undefined) {
    queryClient.setQueryData(["public", "pace", "trends"], message.paceTrends);
  }
  queryClient.setQueryData(["public", "top", "street"], {
    groupBy: "street",
    items: message.topStreets,
  });
  queryClient.setQueryData(["public", "top", "offence"], {
    groupBy: "offence",
    items: message.topOffences,
  });
  queryClient.setQueryData(["public", "locations", "streets"], message.streets);
  queryClient.setQueryData(["public", "locations", "suburbs"], message.suburbs);
  queryClient.setQueryData(["public", "vehicles", "top"], message.vehicles);
  queryClient.setQueryData(["public", "locations", "map"], message.map);
  queryClient.setQueryData(["public", "infringements", "recent"], {
    data: message.recentInfringements,
    limit: message.recentInfringements.length,
    page: 1,
    total: message.live.allTimeTotal,
  });
};
