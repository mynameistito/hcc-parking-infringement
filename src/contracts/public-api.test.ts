import { describe, expect, it } from "vitest";

import { toPublicInfringement } from "@/contracts/projections";
import {
  liveStatsSchema,
  publicInfringementSchema,
} from "@/contracts/public-api";
import type { InfringementRow } from "@/durable-objects/types";
import { todayInAuckland } from "@/lib/auckland-time";
import { formatVehicle } from "@/lib/format";
import { percentChange, toTrendResult } from "@/lib/trend";

describe("liveStatsSchema", () => {
  it("parses public live stats", () => {
    const parsed = liveStatsSchema.parse({
      allTimeAmountCents: 100,
      allTimeTotal: 2,
      last24h: 1,
      last30d: 2,
      last7d: 1,
      lastRecordAt: null,
      lastSyncedAt: "2026-01-01T00:00:00.000Z",
      thisMonth: 1,
      today: 1,
      towedToday: 0,
    });

    expect(parsed.last365d).toBe(0);
    expect(parsed.allTimeTotal).toBe(2);
  });
});

describe("toPublicInfringement", () => {
  it("strips internal row fields", () => {
    const row: InfringementRow = {
      amountCents: 6500,
      firstSeenAt: "2026-01-01",
      infringementNumber: 42,
      isTowed: false,
      occurredAt: "2026-01-01T10:00:00+12:00",
      offenceCategory: null,
      offenceCode: "P01",
      offenceDescription: "Expired meter",
      postCode: "3204",
      street: "Victoria St",
      suburb: "Hamilton Central",
      town: "Hamilton",
      updatedAt: "2026-01-02",
      vehicleColour: "Silver",
      vehicleMake: "Toyota",
      vehicleModel: "Corolla",
      vehicleType: "Car",
    };

    const publicRow = toPublicInfringement(row);
    expect(publicInfringementSchema.parse(publicRow)).toEqual(publicRow);
    expect("firstSeenAt" in publicRow).toBe(false);
  });
});

describe("formatVehicle", () => {
  it("falls back to vehicle type", () => {
    expect(
      formatVehicle({
        amountCents: 0,
        infringementNumber: 1,
        isTowed: false,
        occurredAt: "2026-01-01",
        offenceDescription: "x",
        street: "A",
        suburb: null,
        town: null,
        vehicleColour: null,
        vehicleMake: null,
        vehicleModel: null,
        vehicleType: "Van",
      })
    ).toBe("Van");
  });
});

describe("trend helpers", () => {
  it("computes percent change", () => {
    expect(percentChange(10, 5)).toBe(100);
    expect(toTrendResult(10, 5).direction).toBe("up");
  });
});

describe("auckland time", () => {
  it("formats today as YYYY-MM-DD", () => {
    expect(todayInAuckland(new Date("2026-06-26T12:00:00Z"))).toMatch(
      /^\d{4}-\d{2}-\d{2}$/u
    );
  });
});
