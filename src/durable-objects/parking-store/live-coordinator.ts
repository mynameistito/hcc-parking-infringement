import { DashboardLiveState } from "./dashboard-live.ts";
import { recomputeStatsLive } from "./stats.ts";
import { broadcastToWebSockets } from "./websocket.ts";

/** Coordinates cached dashboard snapshots and WebSocket broadcasts. */
export class LiveCoordinator {
  private readonly dashboardLive = new DashboardLiveState();
  private readonly sql: SqlStorage;
  private readonly getWebSockets: () => WebSocket[];

  /**
   * Creates a coordinator for a store and its active WebSockets.
   * @param sql - The Durable Object SQL storage.
   * @param getWebSockets - Retrieves currently connected sockets.
   */
  constructor(sql: SqlStorage, getWebSockets: () => WebSocket[]) {
    this.sql = sql;
    this.getWebSockets = getWebSockets;
  }

  /**
   * Resolves the current cached or freshly built dashboard payload.
   * @returns The serialized dashboard snapshot.
   */
  resolveSnapshotPayload(): string {
    return this.dashboardLive.resolve(this.sql);
  }

  /** Rebuilds the cached dashboard snapshot from storage. */
  refreshSnapshotCache(): void {
    this.dashboardLive.refresh(this.sql);
  }

  /** Refreshes the snapshot and sends it to connected WebSockets. */
  broadcastLiveUpdate(): void {
    const payload = this.dashboardLive.refresh(this.sql);
    broadcastToWebSockets(this.getWebSockets(), payload);
  }

  /** Recomputes live statistics before broadcasting an updated snapshot. */
  recomputeAndBroadcast(): void {
    recomputeStatsLive(this.sql);
    this.broadcastLiveUpdate();
  }
}
