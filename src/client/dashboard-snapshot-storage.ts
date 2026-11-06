import { z } from "zod";

import {
  getDashboardSnapshotPayloadWeight,
  parseFullDashboardMessage,
} from "@/contracts/dashboard-snapshot";
import type { FullDashboardMessage } from "@/contracts/public-api";
import { nowInAucklandIso } from "@/lib/auckland-time";

const DASHBOARD_SNAPSHOT_CACHE_KEY = "hcc-dashboard-snapshot:v7";
const DASHBOARD_SNAPSHOT_CACHE_VERSION = 7;
const DASHBOARD_SNAPSHOT_DB_NAME = "hcc-dashboard";
const DASHBOARD_SNAPSHOT_DB_STORE = "snapshots";

interface CachedDashboardSnapshot {
  version: typeof DASHBOARD_SNAPSHOT_CACHE_VERSION;
  savedAt: string;
  snapshot: FullDashboardMessage;
}

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

const cachedSnapshotSchema = z.object({
  savedAt: z.string(),
  snapshot: z.unknown().transform((value, context) => {
    const snapshot = parseFullDashboardMessage(value);

    if (snapshot === null) {
      context.addIssue({
        code: "custom",
        message: "Invalid cached dashboard snapshot",
      });

      return z.NEVER;
    }

    return snapshot;
  }),
  version: z.literal(DASHBOARD_SNAPSHOT_CACHE_VERSION),
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
          const cached = cachedSnapshotSchema.safeParse(request.result);
          resolve(cached.success ? cached.data : null);
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
      savedAt: nowInAucklandIso(),
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

export const getDashboardSnapshotWeight = getDashboardSnapshotPayloadWeight;

/**
 * Read the local-storage dashboard fallback.
 * @returns The resulting `FullDashboardMessage | null` value.
 */
export const readPersistedDashboardSnapshotSync =
  (): FullDashboardMessage | null => {
    try {
      const raw = window.localStorage.getItem(DASHBOARD_SNAPSHOT_CACHE_KEY);

      if (raw === null) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      const cachedResult = cachedSnapshotSchema.safeParse(parsed);
      const cached = cachedResult.success ? cachedResult.data : null;

      if (cached !== null && getDashboardSnapshotWeight(cached.snapshot) > 0) {
        return cached.snapshot;
      }
    } catch {
      // Storage can be unavailable in private or locked-down browsing modes.
    }

    return null;
  };

/**
 * Restore the newest available cached dashboard snapshot.
 * @returns The resulting `Promise<FullDashboardMessage | null>` value.
 */
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
      const cachedResult = cachedSnapshotSchema.safeParse(parsed);
      const cached = cachedResult.success ? cachedResult.data : null;

      if (cached !== null && getDashboardSnapshotWeight(cached.snapshot) > 0) {
        try {
          await writeDashboardSnapshotToIndexedDb(cached);
        } catch {
          // Keep using the localStorage copy if migration is unavailable.
        }

        return cached.snapshot;
      }

      window.localStorage.removeItem(DASHBOARD_SNAPSHOT_CACHE_KEY);
    } catch {
      // Storage can be unavailable in private or locked-down browsing modes.
    }

    return null;
  };

/**
 * Persist a nonempty dashboard snapshot for offline startup.
 * @param snapshot - Validated dashboard snapshot.
 */
export const persistDashboardSnapshot = (
  snapshot: FullDashboardMessage
): void => {
  if (getDashboardSnapshotWeight(snapshot) === 0) {
    return;
  }

  void (async () => {
    try {
      const cached: CachedDashboardSnapshot = {
        savedAt: nowInAucklandIso(),
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
