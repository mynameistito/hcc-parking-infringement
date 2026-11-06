import { describe, expect, it, vi } from "vitest";

import { buildTrendWindowChart, dailyTrendSpanDays } from "@/lib/trend-window";

describe("daily trend span", () => {
  it("spans from the earliest trend point through the current day", () => {
    expect(
      dailyTrendSpanDays(
        [
          { count: 4, date: "2026-06-15", totalCents: 4000 },
          { count: 2, date: "2026-06-13", totalCents: 2000 },
        ],
        "2026-06-15"
      )
    ).toBe(3);
  });
});

describe("trend window aggregation", () => {
  it("supports both the boolean and object weekly aggregation options", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00+12:00"));

    try {
      const points = [
        { count: 4, date: "2026-06-15", totalCents: 4000 },
        { count: 2, date: "2026-06-13", totalCents: 2000 },
      ];

      expect(
        buildTrendWindowChart(points, 7, "count", true).values
      ).toStrictEqual([6]);
      expect(
        buildTrendWindowChart(points, 7, "count", false).values
      ).toStrictEqual([0, 0, 0, 0, 2, 0, 4]);
      expect(
        buildTrendWindowChart(points, 7, "count", { aggregateWeekly: true })
          .values
      ).toStrictEqual([6]);
    } finally {
      vi.useRealTimers();
    }
  });
});
