import { getSeedRefreshCoordinator } from "@/server/seed-refresh-coordinator.ts";

/**
 * Forward a seed dashboard subscription to its coordinator.
 * @param request - Incoming HTTP request.
 * @param env - Worker runtime bindings.
 * @returns The resulting `Promise<Response>` value.
 */
export const handleSeedDashboardWebSocket = async (
  request: Request,
  env: Env
): Promise<Response> => await getSeedRefreshCoordinator(env).fetch(request);
