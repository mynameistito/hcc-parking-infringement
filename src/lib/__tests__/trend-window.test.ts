import { describe, expect, it } from "vitest";

import { dailyTrendSpanDays } from "@/lib/trend-window";

describe("dailyTrendSpanDays", () => {
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
