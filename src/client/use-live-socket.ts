import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";

import {
  applyDashboardSnapshot,
  getDashboardSnapshotTime,
  parseDashboardMessage,
  persistDashboardSnapshot,
  readPersistedDashboardSnapshot,
} from "@/client/dashboard-snapshot";
import { getDashboardSnapshotWeight } from "@/client/dashboard-snapshot-storage";
import type { FullDashboardMessage } from "@/contracts/public-api";

const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 30_000;
const SOCKET_IDLE_CLOSE_MS = 2000;

/**
 * Readiness, connectivity, and cache availability of dashboard transport.
 */
export interface LiveTransportState {
  cached: boolean;
  connected: boolean;
  ready: boolean;
}

interface LiveSocketStore extends LiveTransportState {
  refCount: number;
  ws: WebSocket | null;
  reconnectTimer: number | null;
  pingTimer: number | null;
  idleCloseTimer: number | null;
  lastSnapshotTime: number;
  lastSnapshotWeight: number;
  queryClient: ReturnQueryClient | null;
}

type ReturnQueryClient = ReturnType<typeof useQueryClient>;

type Listener = () => void;

const listeners = new Set<Listener>();

const store: LiveSocketStore = {
  cached: false,
  connected: false,
  idleCloseTimer: null,
  lastSnapshotTime: 0,
  lastSnapshotWeight: 0,
  pingTimer: null,
  queryClient: null,
  ready: false,
  reconnectTimer: null,
  refCount: 0,
  ws: null,
};

let snapshot: LiveTransportState = {
  cached: store.cached,
  connected: store.connected,
  ready: store.ready,
};

const emit = (): void => {
  if (
    snapshot.connected !== store.connected ||
    snapshot.cached !== store.cached ||
    snapshot.ready !== store.ready
  ) {
    snapshot = {
      cached: store.cached,
      connected: store.connected,
      ready: store.ready,
    };
  }

  for (const listener of listeners) {
    listener();
  }
};

const liveSocketUrl = (): string => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/api/v1/live/ws`;
};

const clearReconnectTimer = (): void => {
  if (store.reconnectTimer !== null) {
    window.clearTimeout(store.reconnectTimer);
    store.reconnectTimer = null;
  }
};

const clearPingTimer = (): void => {
  if (store.pingTimer !== null) {
    window.clearInterval(store.pingTimer);
    store.pingTimer = null;
  }
};

const clearIdleCloseTimer = (): void => {
  if (store.idleCloseTimer !== null) {
    window.clearTimeout(store.idleCloseTimer);
    store.idleCloseTimer = null;
  }
};

const onSnapshot = (message: FullDashboardMessage): void => {
  const messageTime = getDashboardSnapshotTime(message);
  const messageWeight = getDashboardSnapshotWeight(message);
  const isStale = messageTime < store.lastSnapshotTime;
  const isEmptyRegression = messageWeight === 0 && store.lastSnapshotWeight > 0;

  if (!isStale && !isEmptyRegression) {
    if (store.queryClient !== null) {
      applyDashboardSnapshot(store.queryClient, message);
    }

    persistDashboardSnapshot(message);
    store.lastSnapshotTime = messageTime;
    store.lastSnapshotWeight = messageWeight;
    store.ready = true;
  }

  // Handshake complete: live socket delivered a snapshot (even if we kept newer
  // cached data). Stop showing the cache→live "Updating..." handoff state.
  store.cached = false;
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

const getSnapshot = (): LiveTransportState => snapshot;

/**
 * Restore dashboard queries from a cached full snapshot.
 * @param queryClient - Dashboard query cache.
 * @param message - Validated dashboard snapshot.
 */
export const restoreDashboardFromCache = (
  queryClient: ReturnQueryClient,
  message: FullDashboardMessage
): void => {
  applyDashboardSnapshot(queryClient, message);
  store.lastSnapshotTime = getDashboardSnapshotTime(message);
  store.lastSnapshotWeight = getDashboardSnapshotWeight(message);
  store.ready = true;
  store.cached = true;
  emit();
};

/**
 * Maintain the dashboard socket and reconnect lifecycle.
 * @returns The resulting `LiveTransportState` value.
 */
export const useLiveSocket = (): LiveTransportState => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const cached = await readPersistedDashboardSnapshot();

      if (cancelled || cached === null) {
        return;
      }

      const cachedTime = getDashboardSnapshotTime(cached);
      const cachedWeight = getDashboardSnapshotWeight(cached);

      if (cachedTime < store.lastSnapshotTime) {
        return;
      }

      if (cachedWeight === 0 && store.lastSnapshotWeight > 0) {
        return;
      }

      // Live snapshot may arrive while IndexedDB is still loading; do not
      // regress to cached state when the socket already delivered fresh data.
      if (store.connected && cachedTime <= store.lastSnapshotTime) {
        return;
      }

      applyDashboardSnapshot(queryClient, cached);
      store.lastSnapshotTime = cachedTime;
      store.lastSnapshotWeight = cachedWeight;
      store.ready = true;
      store.cached = !store.connected;
      emit();
    })();

    acquireLiveSocket(queryClient);

    return () => {
      cancelled = true;
      releaseLiveSocket();
    };
  }, [queryClient]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
