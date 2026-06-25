import type { QueryClient } from "@tanstack/react-query";

import type {
  LiveStatsResponse,
  LocationRankItem,
  MapResponse,
  PublicInfringement,
  TopItem,
  VehicleRankItem,
} from "./api";

export interface FullDashboardMessage {
  type: "full";
  at: string;
  live: LiveStatsResponse;
  recentInfringements: PublicInfringement[];
  topStreets: TopItem[];
  topOffences: TopItem[];
  streets: LocationRankItem[];
  suburbs: LocationRankItem[];
  vehicles: VehicleRankItem[];
  map: MapResponse;
}

const DASHBOARD_SNAPSHOT_CACHE_KEY = "hcc-dashboard-snapshot:v1";
const DASHBOARD_SNAPSHOT_CACHE_VERSION = 1;
const DASHBOARD_SNAPSHOT_DB_NAME = "hcc-dashboard";
const DASHBOARD_SNAPSHOT_DB_STORE = "snapshots";

interface CachedDashboardSnapshot {
  version: typeof DASHBOARD_SNAPSHOT_CACHE_VERSION;
  savedAt: string;
  snapshot: FullDashboardMessage;
}

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

const isCachedDashboardSnapshot = (
  value: unknown
): value is CachedDashboardSnapshot =>
  isRecord(value) &&
  value.version === DASHBOARD_SNAPSHOT_CACHE_VERSION &&
  typeof value.savedAt === "string" &&
  isFullDashboardMessage(value.snapshot);

const toStorageError = (error: DOMException | null): Error =>
  new Error(error?.message ?? "Dashboard snapshot storage failed");

const openDashboardSnapshotDb = async (): Promise<IDBDatabase> =>
  // eslint-disable-next-line promise/avoid-new -- IndexedDB is event-based.
  await new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DASHBOARD_SNAPSHOT_DB_NAME, 1);

    request.addEventListener("upgradeneeded", () => {
      request.result.createObjectStore(DASHBOARD_SNAPSHOT_DB_STORE);
    });

    request.addEventListener("success", () => {
      resolve(request.result);
    });

    request.addEventListener("error", () => {
      reject(toStorageError(request.error));
    });
  });

const readDashboardSnapshotFromIndexedDb =
  async (): Promise<CachedDashboardSnapshot | null> => {
    const db = await openDashboardSnapshotDb();

    try {
      // eslint-disable-next-line promise/avoid-new -- IndexedDB is event-based.
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(
          DASHBOARD_SNAPSHOT_DB_STORE,
          "readonly"
        );
        const store = transaction.objectStore(DASHBOARD_SNAPSHOT_DB_STORE);
        const request = store.get(DASHBOARD_SNAPSHOT_CACHE_KEY);

        request.addEventListener("success", () => {
          const result: unknown = Reflect.get(request, "result");
          resolve(isCachedDashboardSnapshot(result) ? result : null);
        });

        request.addEventListener("error", () => {
          reject(toStorageError(request.error));
        });
      });
    } finally {
      db.close();
    }
  };

const writeDashboardSnapshotToIndexedDb = async (
  cached: CachedDashboardSnapshot
): Promise<void> => {
  const db = await openDashboardSnapshotDb();

  try {
    // eslint-disable-next-line promise/avoid-new -- IndexedDB is event-based.
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(
        DASHBOARD_SNAPSHOT_DB_STORE,
        "readwrite"
      );
      const store = transaction.objectStore(DASHBOARD_SNAPSHOT_DB_STORE);
      store.put(cached, DASHBOARD_SNAPSHOT_CACHE_KEY);

      transaction.addEventListener("complete", () => {
        resolve();
      });

      transaction.addEventListener("error", () => {
        reject(toStorageError(transaction.error));
      });
    });
  } finally {
    db.close();
  }
};

const persistDashboardSnapshotToLocalStorage = (
  snapshot: FullDashboardMessage
): void => {
  try {
    const cached: CachedDashboardSnapshot = {
      savedAt: new Date().toISOString(),
      snapshot,
      version: DASHBOARD_SNAPSHOT_CACHE_VERSION,
    };
    window.localStorage.setItem(
      DASHBOARD_SNAPSHOT_CACHE_KEY,
      JSON.stringify(cached)
    );
  } catch {
    // Best-effort cache only.
  }
};

export const parseDashboardMessage = (
  data: string
): FullDashboardMessage | null => {
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

export const getDashboardSnapshotTime = (
  message: FullDashboardMessage
): number => {
  const source = message.live.lastSyncedAt ?? message.at;
  const parsed = Date.parse(source);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const getDashboardSnapshotWeight = (
  message: FullDashboardMessage
): number =>
  message.recentInfringements.length +
  message.topStreets.length +
  message.topOffences.length +
  message.streets.length +
  message.suburbs.length +
  message.vehicles.length +
  message.map.routes.length;

export const readPersistedDashboardSnapshot =
  async (): Promise<FullDashboardMessage | null> => {
    try {
      const cached = await readDashboardSnapshotFromIndexedDb();
      if (cached !== null && getDashboardSnapshotWeight(cached.snapshot) > 0) {
        return cached.snapshot;
      }
    } catch {
      // Fall back to localStorage below.
    }

    try {
      const raw = window.localStorage.getItem(DASHBOARD_SNAPSHOT_CACHE_KEY);
      if (raw === null) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (
        isCachedDashboardSnapshot(parsed) &&
        getDashboardSnapshotWeight(parsed.snapshot) > 0
      ) {
        try {
          await writeDashboardSnapshotToIndexedDb(parsed);
        } catch {
          // Keep using the localStorage copy if migration is unavailable.
        }
        return parsed.snapshot;
      }

      window.localStorage.removeItem(DASHBOARD_SNAPSHOT_CACHE_KEY);
    } catch {
      // Storage can be unavailable in private or locked-down browsing modes.
    }

    return null;
  };

export const persistDashboardSnapshot = (
  snapshot: FullDashboardMessage
): void => {
  if (getDashboardSnapshotWeight(snapshot) === 0) {
    return;
  }

  void (async () => {
    try {
      const cached: CachedDashboardSnapshot = {
        savedAt: new Date().toISOString(),
        snapshot,
        version: DASHBOARD_SNAPSHOT_CACHE_VERSION,
      };

      await writeDashboardSnapshotToIndexedDb(cached);

      try {
        window.localStorage.removeItem(DASHBOARD_SNAPSHOT_CACHE_KEY);
      } catch {
        // Best-effort cleanup only.
      }
    } catch {
      persistDashboardSnapshotToLocalStorage(snapshot);
    }
  })();
};

export const applyDashboardSnapshot = (
  queryClient: QueryClient,
  message: FullDashboardMessage
): void => {
  queryClient.setQueryData(["public", "live"], message.live);
  queryClient.setQueryData(["public", "top", "street"], {
    groupBy: "street",
    items: message.topStreets,
  });
  queryClient.setQueryData(["public", "top", "offence"], {
    groupBy: "offence",
    items: message.topOffences,
  });
  queryClient.setQueryData(["public", "locations", "streets"], message.streets);
  queryClient.setQueryData(["public", "locations", "suburbs"], message.suburbs);
  queryClient.setQueryData(["public", "vehicles", "top"], message.vehicles);
  queryClient.setQueryData(["public", "locations", "map"], message.map);
  queryClient.setQueryData(["public", "infringements", "recent"], {
    data: message.recentInfringements,
    limit: message.recentInfringements.length,
    page: 1,
    total: message.live.allTimeTotal,
  });
};
