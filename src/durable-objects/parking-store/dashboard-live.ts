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

export class DashboardLiveState {
  private cachedPayload: string | null = null;

  refresh(sql: SqlStorage): string {
    const payload = buildFullDashboardSnapshotPayload(
      assembleFullDashboardSnapshot(sql)
    );
    this.cachedPayload = payload;
    writeDashboardSnapshotCache(sql, payload);
    return payload;
  }

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

  getCachedPayload(): string | null {
    return this.cachedPayload;
  }
}
