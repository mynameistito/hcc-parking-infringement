import { getSeedRefreshCoordinator } from "@/server/seed-refresh-coordinator.ts";

export const handleSeedDashboardWebSocket = async (
  request: Request,
  env: Env
): Promise<Response> => await getSeedRefreshCoordinator(env).fetch(request);
