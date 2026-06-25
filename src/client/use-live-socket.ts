import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { applyDashboardSnapshot } from "./dashboard-snapshot";
import type { FullDashboardMessage } from "./dashboard-snapshot";

const liveSocketUrl = (): string => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/public/live/ws`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFullDashboardMessage = (
  value: unknown
): value is FullDashboardMessage =>
  isRecord(value) &&
  value.type === "full" &&
  typeof value.at === "string" &&
  isRecord(value.live) &&
  Array.isArray(value.topStreets) &&
  Array.isArray(value.topOffences) &&
  Array.isArray(value.streets) &&
  Array.isArray(value.suburbs) &&
  Array.isArray(value.vehicles) &&
  isRecord(value.map);

const parseDashboardMessage = (data: string): FullDashboardMessage | null => {
  try {
    const parsed: unknown = JSON.parse(data);
    if (isFullDashboardMessage(parsed)) {
      return parsed;
    }
  } catch {
    // ignore malformed messages
  }
  return null;
};

export const useLiveSocket = (): boolean => {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let pingTimer: number | undefined;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(liveSocketUrl());

      ws.addEventListener("open", () => {
        setConnected(true);
      });

      ws.addEventListener("close", () => {
        setConnected(false);
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, 3000);
        }
      });

      ws.addEventListener("error", () => {
        ws?.close();
      });

      ws.addEventListener("message", (event) => {
        const message = parseDashboardMessage(String(event.data));
        if (message !== null) {
          applyDashboardSnapshot(queryClient, message);
        }
      });

      pingTimer = window.setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, 30_000);
    };

    connect();

    return () => {
      closed = true;
      window.clearTimeout(reconnectTimer);
      window.clearInterval(pingTimer);
      ws?.close();
    };
  }, [queryClient]);

  return connected;
};
