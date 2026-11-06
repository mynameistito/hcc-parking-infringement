import { isoNow } from "./constants.ts";
import {
  assembleFullDashboardSnapshot,
  buildColdDashboardSnapshotPayload,
  buildFullDashboardSnapshotPayload,
  getDashboardSnapshotPayloadWeight,
  readStoredDashboardSnapshotPayload,
  snapshotIsComplete,
  writeDashboardSnapshotCache,
} from "./dashboard-snapshot.ts";
import { readPaceTrends } from "./pace-trends.ts";
import { readPublicLiveStats } from "./stats.ts";

/** Maintains and resolves the cached live dashboard payload. */
export class DashboardLiveState {
  private cachedPayload: string | null = null;

  /**
   * Rebuilds and stores a full dashboard payload.
   * @param sql - The Durable Object SQL storage.
   * @returns The serialized dashboard payload.
   */
  refresh(sql: SqlStorage): string {
    const payload = buildFullDashboardSnapshotPayload(
      assembleFullDashboardSnapshot(sql)
    );

    this.cachedPayload = payload;
    writeDashboardSnapshotCache(sql, payload);

    return payload;
  }

  /**
   * Resolves a complete cached payload or rebuilds one from storage.
   * @param sql - The Durable Object SQL storage.
   * @returns The serialized dashboard payload.
   */
  resolve(sql: SqlStorage): string {
    const payload =
      this.cachedPayload ?? readStoredDashboardSnapshotPayload(sql);

    if (
      payload !== null &&
      getDashboardSnapshotPayloadWeight(payload) > 0 &&
      snapshotIsComplete(payload)
    ) {
      this.cachedPayload = payload;

      return payload;
    }

    this.refresh(sql);

    return (
      this.cachedPayload ??
      buildColdDashboardSnapshotPayload(
        readPublicLiveStats(sql),
        readPaceTrends(sql),
        isoNow()
      )
    );
  }

  /**
   * Reads the in-memory dashboard cache.
   * @returns The cached payload, or null before it is populated.
   */
  getCachedPayload(): string | null {
    return this.cachedPayload;
  }
}
