import type { QueryClient } from "@tanstack/react-query";

import type {
  LiveStatsResponse,
  LocationRankItem,
  MapResponse,
  PublicInfringement,
  TopItem,
  VehicleRankItem,
} from "./api";

export interface FullDashboardMessage {
  type: "full";
  at: string;
  live: LiveStatsResponse;
  recentInfringements: PublicInfringement[];
  topStreets: TopItem[];
  topOffences: TopItem[];
  streets: LocationRankItem[];
  suburbs: LocationRankItem[];
  vehicles: VehicleRankItem[];
  map: MapResponse;
}

export const applyDashboardSnapshot = (
  queryClient: QueryClient,
  message: FullDashboardMessage
): void => {
  queryClient.setQueryData(["public", "live"], message.live);
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
