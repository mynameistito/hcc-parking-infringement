import { isoNow } from "./constants.ts";

export const handleWebSocketMessage = (
  ws: WebSocket,
  message: string | ArrayBuffer
): void => {
  const text =
    typeof message === "string" ? message : new TextDecoder().decode(message);
  if (text === "ping") {
    ws.send(JSON.stringify({ at: isoNow(), type: "pong" }));
  }
};

export const broadcastToWebSockets = (
  sockets: WebSocket[],
  payload: string
): void => {
  for (const ws of sockets) {
    try {
      ws.send(payload);
    } catch {
      // socket already closed
    }
  }
};

export const pushToWebSocket = (ws: WebSocket, payload: string): void => {
  try {
    ws.send(payload);
  } catch {
    // socket already closed
  }
};
