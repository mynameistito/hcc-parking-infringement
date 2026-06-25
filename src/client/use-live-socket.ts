import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore } from "react";

import { applyDashboardSnapshot } from "./dashboard-snapshot";
import type { FullDashboardMessage } from "./dashboard-snapshot";

const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 30_000;
const SOCKET_IDLE_CLOSE_MS = 2000;

export interface LiveTransportState {
  connected: boolean;
  ready: boolean;
}

interface LiveSocketStore extends LiveTransportState {
  refCount: number;
  ws: WebSocket | null;
  reconnectTimer: number | undefined;
  pingTimer: number | undefined;
  idleCloseTimer: number | undefined;
  queryClient: ReturnQueryClient | null;
}

type ReturnQueryClient = ReturnType<typeof useQueryClient>;

type Listener = () => void;

const listeners = new Set<Listener>();

const store: LiveSocketStore = {
  connected: false,
  idleCloseTimer: undefined,
  pingTimer: undefined,
  queryClient: null,
  ready: false,
  reconnectTimer: undefined,
  refCount: 0,
  ws: null,
};

const emit = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

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
  Array.isArray(value.recentInfringements) &&
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

const clearReconnectTimer = (): void => {
  if (store.reconnectTimer !== undefined) {
    window.clearTimeout(store.reconnectTimer);
    store.reconnectTimer = undefined;
  }
};

const clearPingTimer = (): void => {
  if (store.pingTimer !== undefined) {
    window.clearInterval(store.pingTimer);
    store.pingTimer = undefined;
  }
};

const clearIdleCloseTimer = (): void => {
  if (store.idleCloseTimer !== undefined) {
    window.clearTimeout(store.idleCloseTimer);
    store.idleCloseTimer = undefined;
  }
};

const onSnapshot = (message: FullDashboardMessage): void => {
  if (store.queryClient !== null) {
    applyDashboardSnapshot(store.queryClient, message);
  }
  store.ready = true;
  emit();
};

const connect = (): void => {
  clearReconnectTimer();
  clearPingTimer();

  if (
    store.ws?.readyState === WebSocket.CONNECTING ||
    store.ws?.readyState === WebSocket.OPEN
  ) {
    return;
  }

  const ws = new WebSocket(liveSocketUrl());
  store.ws = ws;

  ws.addEventListener("open", () => {
    store.connected = true;
    emit();
  });

  ws.addEventListener("close", () => {
    store.connected = false;
    store.ws = null;
    emit();
    if (store.refCount > 0) {
      clearReconnectTimer();
      store.reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY_MS);
    }
  });

  ws.addEventListener("error", () => {
    ws.close();
  });

  ws.addEventListener("message", (event) => {
    const message = parseDashboardMessage(String(event.data));
    if (message !== null) {
      onSnapshot(message);
    }
  });

  store.pingTimer = window.setInterval(() => {
    if (store.ws?.readyState === WebSocket.OPEN) {
      store.ws.send("ping");
    }
  }, PING_INTERVAL_MS);
};

const acquireLiveSocket = (queryClient: ReturnQueryClient): void => {
  store.queryClient = queryClient;
  store.refCount += 1;
  clearIdleCloseTimer();
  connect();
};

const releaseLiveSocket = (): void => {
  store.refCount = Math.max(0, store.refCount - 1);
  if (store.refCount > 0) {
    return;
  }

  clearIdleCloseTimer();
  store.idleCloseTimer = window.setTimeout(() => {
    if (store.refCount > 0) {
      return;
    }
    clearReconnectTimer();
    clearPingTimer();
    store.ws?.close();
    store.ws = null;
    store.connected = false;
    emit();
  }, SOCKET_IDLE_CLOSE_MS);
};

const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): LiveTransportState => ({
  connected: store.connected,
  ready: store.ready,
});

export const useLiveSocket = (): LiveTransportState => {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    acquireLiveSocket(queryClient);
    return () => {
      releaseLiveSocket();
    };
  }, [queryClient]);

  const liveState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!mounted) {
    return { connected: false, ready: false };
  }

  return liveState;
};
