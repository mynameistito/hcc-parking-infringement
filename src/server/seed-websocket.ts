import { handleWebSocketUpgrade } from "@/durable-objects/parking-store/websocket.ts";
import type { AppScope } from "@/server/app-scope.ts";

export const handleSeedDashboardWebSocket = async (
  request: Request,
  scope: AppScope
): Promise<Response> => {
  const payload = await scope.parking.readDashboardSnapshotPayload();

  return handleWebSocketUpgrade(
    request,
    (ws) => {
      ws.accept();
    },
    () => payload
  );
};
