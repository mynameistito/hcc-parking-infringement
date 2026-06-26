import { describe, expect, it } from "vitest";

import {
  dashboardSnapshotIsComplete,
  getDashboardSnapshotPayloadWeight,
  parseFullDashboardMessageJson,
  parsePublicDashboardSnapshotJson,
} from "@/contracts/dashboard-snapshot";

const minimalFullMessage = {
  at: "2026-01-01T00:00:00.000+13:00",
  dailyTrend: [{ count: 1, date: "2026-01-01", totalCents: 100 }],
  live: {
    allTimeAmountCents: 100,
    allTimeTotal: 1,
    last24h: 1,
    last30d: 1,
    last365d: 1,
    last7d: 1,
    lastRecordAt: null,
    lastSyncedAt: "2026-01-01T00:00:00.000+13:00",
    thisMonth: 1,
    today: 1,
    towedToday: 0,
  },
  map: { pendingGeocode: 0, routes: [] },
  paceTrends: {
    last30d: { current: 1, direction: "flat", percent: 0, previous: 1 },
    last365d: { current: 1, direction: "flat", percent: 0, previous: 1 },
    last7d: { current: 1, direction: "flat", percent: 0, previous: 1 },
  },
  recentInfringements: [],
  streets: [],
  suburbs: [],
  topOffences: [],
  topStreets: [],
  type: "full" as const,
  vehicles: [],
};

describe("parseFullDashboardMessageJson", () => {
  it("parses valid snapshot JSON", () => {
    const message = parseFullDashboardMessageJson(
      JSON.stringify(minimalFullMessage)
    );
    expect(message?.type).toBe("full");
    expect(message?.dailyTrend).toHaveLength(1);
  });

  it("rejects malformed JSON", () => {
    expect(parseFullDashboardMessageJson("{")).toBeNull();
    expect(parseFullDashboardMessageJson('{"type":"partial"}')).toBeNull();
  });
});

describe("dashboard snapshot helpers", () => {
  it("computes payload weight from parsed message", () => {
    const message = parseFullDashboardMessageJson(
      JSON.stringify({
        ...minimalFullMessage,
        recentInfringements: [
          {
            amountCents: 100,
            infringementNumber: 1,
            isTowed: false,
            occurredAt: "2026-01-01T00:00:00.000+13:00",
            offenceDescription: "Test",
            street: "Victoria St",
            suburb: null,
            town: null,
            vehicleColour: null,
            vehicleMake: null,
            vehicleModel: null,
            vehicleType: null,
          },
        ],
        topStreets: [{ count: 1, label: "Victoria St" }],
      })
    );

    expect(message).not.toBeNull();
    if (message === null) {
      return;
    }

    expect(getDashboardSnapshotPayloadWeight(message)).toBe(2);
    expect(dashboardSnapshotIsComplete(message)).toBe(true);
  });

  it("maps to internal snapshot shape with normalized geometry", () => {
    const snapshot = parsePublicDashboardSnapshotJson(
      JSON.stringify(minimalFullMessage)
    );

    expect(snapshot?.live.allTimeTotal).toBe(1);
    expect(snapshot?.dailyTrend).toHaveLength(1);
  });
});
