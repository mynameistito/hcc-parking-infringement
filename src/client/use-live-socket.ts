import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  applyDashboardSnapshot,
  getDashboardSnapshotTime,
  getDashboardSnapshotWeight,
  parseDashboardMessage,
  persistDashboardSnapshot,
  readPersistedDashboardSnapshot,
} from "./dashboard-snapshot";
import type { FullDashboardMessage } from "./dashboard-snapshot";

const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 30_000;
const SOCKET_IDLE_CLOSE_MS = 2000;

export interface LiveTransportState {
  cached: boolean;
  connected: boolean;
  ready: boolean;
}

interface LiveSocketStore extends LiveTransportState {
  refCount: number;
  ws: WebSocket | null;
  reconnectTimer: number | undefined;
  pingTimer: number | undefined;
  idleCloseTimer: number | undefined;
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
  idleCloseTimer: undefined,
  lastSnapshotTime: 0,
  lastSnapshotWeight: 0,
  pingTimer: undefined,
  queryClient: null,
  ready: false,
  reconnectTimer: undefined,
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
  return `${protocol}//${window.location.host}/api/public/live/ws`;
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

export const useLiveSocket = (): LiveTransportState => {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setMounted(true);
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

  const liveState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!mounted) {
    return { cached: false, connected: false, ready: false };
  }

  return liveState;
};
