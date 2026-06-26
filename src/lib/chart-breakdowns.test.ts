import { describe, expect, it } from "vitest";

import type { FullDashboardMessage } from "@/contracts/public-api";
import {
  buildChartBreakdownFromInfringements,
  chartBreakdownsFullyPopulated,
  chartBreakdownsHasData,
  resolveChartBreakdowns,
  resolveChartStreetItems,
} from "@/lib/chart-breakdowns";

const baseMessage = {
  at: "2026-01-01T00:00:00.000+13:00",
  live: {
    allTimeAmountCents: 100,
    allTimeTotal: 10,
    last24h: 1,
    last30d: 2,
    last365d: 2,
    last7d: 1,
    lastRecordAt: null,
    lastSyncedAt: "2026-01-01T00:00:00.000+13:00",
    thisMonth: 1,
    today: 1,
    towedToday: 0,
  },
  map: { pendingGeocode: 0, routes: [] },
  recentInfringements: [],
  streets: [{ count: 8, label: "Victoria St, CBD", street: "Victoria St" }],
  suburbs: [{ count: 5, label: "CBD" }],
  topOffences: [{ count: 4, label: "Parked in a clearway" }],
  topStreets: [{ count: 2, label: "Anglesea St" }],
  type: "full" as const,
  vehicles: [
    { count: 3, label: "Toyota Corolla", make: "Toyota", model: "Corolla" },
    { count: 2, label: "Toyota Hilux", make: "Toyota", model: "Hilux" },
    { count: 1, label: "Mazda 3", make: "Mazda", model: "3" },
  ],
};

describe("resolveChartBreakdowns", () => {
  it("derives breakdown slices from legacy snapshot fields", () => {
    const breakdowns = resolveChartBreakdowns(
      baseMessage satisfies FullDashboardMessage
    );

    expect(chartBreakdownsHasData(breakdowns)).toBe(true);
    expect(breakdowns.suburbs).toEqual([{ count: 5, label: "CBD" }]);
    expect(breakdowns.offences).toEqual([
      { count: 4, label: "Parked in a clearway" },
    ]);
    expect(breakdowns.vehicleMakes).toEqual([
      { count: 5, label: "Toyota" },
      { count: 1, label: "Mazda" },
    ]);
    expect(chartBreakdownsFullyPopulated(breakdowns)).toBe(false);
  });

  it("merges partial native breakdowns with legacy snapshot fields", () => {
    const breakdowns = resolveChartBreakdowns({
      ...baseMessage,
      chartBreakdowns: {
        offenceCategories: [],
        offences: [{ count: 99, label: "Stale offence" }],
        suburbs: [],
        towed: [],
        vehicleMakes: [],
        vehicleTypes: [],
      },
    } satisfies FullDashboardMessage);

    expect(breakdowns.offences).toEqual([
      { count: 4, label: "Parked in a clearway" },
    ]);
    expect(breakdowns.suburbs).toEqual([{ count: 5, label: "CBD" }]);
  });

  it("prefers the richer street ranking list for bar charts", () => {
    const streets = resolveChartStreetItems(
      baseMessage satisfies FullDashboardMessage
    );

    expect(streets).toEqual([{ count: 8, label: "Victoria St, CBD" }]);
  });
});

describe("buildChartBreakdownFromInfringements", () => {
  it("aggregates every infringement dimension from historical records", () => {
    const { breakdowns, streets } = buildChartBreakdownFromInfringements([
      {
        isTowed: false,
        offenceCategory: "Parking",
        offenceCode: "P508",
        offenceDescription: "Parked in a clearway",
        street: "Victoria St",
        suburb: "CBD",
        vehicleMake: "Toyota",
        vehicleType: "Car",
      },
      {
        isTowed: true,
        offenceCategory: "Parking",
        offenceCode: "P508",
        offenceDescription: "Parked in a clearway",
        street: "Anglesea St",
        suburb: "Frankton",
        vehicleMake: "Mazda",
        vehicleType: "Ute",
      },
    ]);

    expect(chartBreakdownsHasData(breakdowns)).toBe(true);
    expect(breakdowns.suburbs).toEqual([
      { count: 1, label: "CBD" },
      { count: 1, label: "Frankton" },
    ]);
    expect(breakdowns.towed).toEqual([
      { count: 1, label: "Towed" },
      { count: 1, label: "Not towed" },
    ]);
    expect(chartBreakdownsFullyPopulated(breakdowns)).toBe(true);
    expect(streets).toHaveLength(2);
  });
});
