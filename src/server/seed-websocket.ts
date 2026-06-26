import { handleWebSocketUpgrade } from "@/durable-objects/parking-store/websocket.ts";
import { readSeedDashboardSnapshotPayload } from "@/server/seed-read.ts";

export const handleSeedDashboardWebSocket = async (
  request: Request,
  env: Env
): Promise<Response> => {
  const payload = await readSeedDashboardSnapshotPayload(env);

  return handleWebSocketUpgrade(
    request,
    (ws) => {
      ws.accept();
    },
    () => payload
  );
};
