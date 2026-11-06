import { isoNow } from "./constants.ts";

/**
 * Replies to a ping message on an accepted socket.
 * @param ws - The socket that sent the message.
 * @param message - The text or binary WebSocket message.
 */
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

/**
 * Sends a serialized payload to each socket that remains open.
 * @param sockets - The sockets to notify.
 * @param payload - The serialized message to send.
 */
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

/**
 * Sends a serialized payload to a socket if it remains open.
 * @param ws - The socket to notify.
 * @param payload - The serialized message to send.
 */
export const pushToWebSocket = (ws: WebSocket, payload: string): void => {
  try {
    ws.send(payload);
  } catch {
    // socket already closed
  }
};

/**
 * Accepts a WebSocket upgrade and schedules the initial snapshot.
 * @param request - The incoming upgrade request.
 * @param acceptWebSocket - Registers the server side of the socket pair.
 * @param resolvePayload - Produces the initial serialized snapshot.
 * @returns An upgrade response, or a 426 response for a non-upgrade request.
 */
export const handleWebSocketUpgrade = (
  request: Request,
  acceptWebSocket: (ws: WebSocket) => void,
  resolvePayload: () => string
): Response => {
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);
  acceptWebSocket(server);
  queueMicrotask(() => {
    pushToWebSocket(server, resolvePayload());
  });

  return new Response(null, { status: 101, webSocket: client });
};
