import { describe, expect, it } from "vitest";

import { toPublicInfringement } from "@/contracts/projections";
import {
  liveStatsSchema,
  publicInfringementSchema,
} from "@/contracts/public-api";
import type { InfringementRow } from "@/durable-objects/types";
import { todayInAuckland } from "@/lib/auckland-time";
import { formatStreetSuburb, formatVehicle } from "@/lib/format";
import { resolveOffenceDescription } from "@/lib/offence-catalog";
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
      lastSyncedAt: "2026-01-01T00:00:00.000+13:00",
      thisMonth: 1,
      today: 1,
      towedToday: 0,
    });

    expect(parsed.last365d).toBe(0);
    expect(parsed.allTimeTotal).toBe(2);
  });
});

describe("resolveOffenceDescription", () => {
  it("expands truncated P546 labels from the council feed", () => {
    expect(
      resolveOffenceDescription("P546", "Failed to correctly activate the")
    ).toBe("Failed to correctly activate the parking machine");
  });

  it("expands when only the numeric HCC offence code is stored", () => {
    expect(
      resolveOffenceDescription("824", "Failed to correctly activate the")
    ).toBe("Failed to correctly activate the parking machine");
  });

  it("expands from truncated text without any offence code", () => {
    expect(
      resolveOffenceDescription(undefined, "Failed to correctly activate the")
    ).toBe("Failed to correctly activate the parking machine");
  });

  it("collapses embedded newlines before resolving", () => {
    expect(
      resolveOffenceDescription(
        undefined,
        "Failed to correctly activate the\nparking machine"
      )
    ).toBe("Failed to correctly activate the parking machine");
  });

  it("keeps complete labels when already full", () => {
    expect(resolveOffenceDescription("P508", "Parked in a clearway")).toBe(
      "Parked in a clearway"
    );
  });
});

describe("toPublicInfringement", () => {
  it("resolves truncated offence descriptions for the public API", () => {
    const row: InfringementRow = {
      amountCents: 7000,
      firstSeenAt: "2026-01-01",
      infringementNumber: 99,
      isTowed: false,
      occurredAt: "2026-01-01T10:00:00+13:00",
      offenceCategory: "Parking",
      offenceCode: "P546",
      offenceDescription: "Failed to correctly activate the",
      postCode: "3204",
      street: "Victoria St",
      suburb: "Hamilton Central",
      town: "Hamilton",
      updatedAt: "2026-01-02",
      vehicleColour: null,
      vehicleMake: "Mazda",
      vehicleModel: "RX7",
      vehicleType: "Car",
    };

    expect(toPublicInfringement(row).offenceDescription).toBe(
      "Failed to correctly activate the parking machine"
    );
  });

  it("resolves truncated descriptions when the stored council code is numeric", () => {
    const row: InfringementRow = {
      amountCents: 7000,
      firstSeenAt: "2026-01-01",
      infringementNumber: 100,
      isTowed: false,
      occurredAt: "2026-01-01T10:00:00+13:00",
      offenceCategory: "Parking",
      offenceCode: "824",
      offenceDescription: "Failed to correctly activate the",
      postCode: "3204",
      street: "Victoria St",
      suburb: "Hamilton Central",
      town: "Hamilton",
      updatedAt: "2026-01-02",
      vehicleColour: null,
      vehicleMake: "Mazda",
      vehicleModel: "RX7",
      vehicleType: "Car",
    };

    expect(toPublicInfringement(row).offenceDescription).toBe(
      "Failed to correctly activate the parking machine"
    );
  });

  it("strips internal row fields", () => {
    const row: InfringementRow = {
      amountCents: 6500,
      firstSeenAt: "2026-01-01",
      infringementNumber: 42,
      isTowed: false,
      occurredAt: "2026-01-01T10:00:00+13:00",
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
  it("joins make and model", () => {
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
        vehicleMake: "Mazda",
        vehicleModel: "RX7",
        vehicleType: "Car",
      })
    ).toBe("Mazda RX7");
  });

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

describe("formatStreetSuburb", () => {
  it("joins street and suburb", () => {
    expect(formatStreetSuburb("Victoria St", "Hamilton Central")).toBe(
      "Victoria St, Hamilton Central"
    );
  });

  it("omits unknown suburbs", () => {
    expect(formatStreetSuburb("Victoria St", "Unknown")).toBe("Victoria St");
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
