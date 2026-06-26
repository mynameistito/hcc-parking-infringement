import { DashboardLiveState } from "./dashboard-live.ts";
import { recomputeStatsLive } from "./stats.ts";
import { broadcastToWebSockets } from "./websocket.ts";

export class LiveCoordinator {
  private readonly dashboardLive = new DashboardLiveState();
  private readonly sql: SqlStorage;
  private readonly getWebSockets: () => WebSocket[];

  constructor(sql: SqlStorage, getWebSockets: () => WebSocket[]) {
    this.sql = sql;
    this.getWebSockets = getWebSockets;
  }

  resolveSnapshotPayload(): string {
    return this.dashboardLive.resolve(this.sql);
  }

  refreshSnapshotCache(): void {
    this.dashboardLive.refresh(this.sql);
  }

  broadcastLiveUpdate(): void {
    const payload = this.dashboardLive.refresh(this.sql);
    broadcastToWebSockets(this.getWebSockets(), payload);
  }

  recomputeAndBroadcast(): void {
    recomputeStatsLive(this.sql);
    this.broadcastLiveUpdate();
  }
}
