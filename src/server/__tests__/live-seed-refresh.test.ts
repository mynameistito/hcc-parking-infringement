import { describe, expect, it } from "vitest";

import type { CleanInfringement } from "@/server/clean-schema.ts";
import { buildLiveSeedSnapshot } from "@/server/live-seed-refresh.ts";

const makeRecord = (
  infringementNumber: number,
  occurredAt: string,
  overrides: Partial<CleanInfringement> = {}
): CleanInfringement => ({
  additionalCostsCents: 0,
  amountCents: 4000,
  closedAt: null,
  courtServeMethod: null,
  infringementNumber,
  infringementType: null,
  isTowed: false,
  occurredAt,
  offenceCategory: "Parking",
  offenceCode: "P101",
  offenceDescription: "No valid parking payment",
  postCode: null,
  street: "Victoria Street",
  suburb: "Hamilton Central",
  town: "Hamilton",
  vehicleColour: null,
  vehicleMake: "Toyota",
  vehicleModel: "Corolla",
  vehicleType: "Car",
  ...overrides,
});

describe("buildLiveSeedSnapshot", () => {
  it("deduplicates records and builds dashboard aggregates", () => {
    const snapshot = buildLiveSeedSnapshot({
      existingLive: {
        allTimeAmountCents: 100_000,
        allTimeTotal: 100,
        last24h: 0,
        last30d: 0,
        last365d: 0,
        last7d: 0,
        lastRecordAt: null,
        lastSyncedAt: "2026-06-30T00:00:00.000+12:00",
        thisMonth: 0,
        today: 0,
        towedToday: 0,
      },
      from: "2026-06-29",
      records: [
        makeRecord(1, "2026-06-29T10:00:00+12:00"),
        makeRecord(2, "2026-07-01T09:00:00+12:00", { isTowed: true }),
        makeRecord(2, "2026-07-01T09:00:00+12:00", { isTowed: true }),
      ],
      syncedAt: "2026-07-01T12:00:00.000+12:00",
      to: "2026-07-01",
    });

    expect(snapshot.live.allTimeTotal).toBe(100);
    expect(snapshot.live.today).toBe(1);
    expect(snapshot.live.towedToday).toBe(1);
    expect(snapshot.dailyTrend).toEqual([
      { count: 1, date: "2026-06-29", totalCents: 4000 },
      { count: 0, date: "2026-06-30", totalCents: 0 },
      { count: 1, date: "2026-07-01", totalCents: 4000 },
    ]);
    expect(snapshot.recentInfringements).toHaveLength(2);
    expect(snapshot.streets[0]).toMatchObject({
      count: 2,
      label: "Victoria Street",
      street: "Victoria Street",
    });
  });
});
