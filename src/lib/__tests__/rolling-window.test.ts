import { describe, expect, it } from "vitest";

import { rollingCalendarWindowStart } from "@/lib/rolling-window";

describe("rollingCalendarWindowStart", () => {
  it("returns the inclusive start date for an N-day calendar window", () => {
    const now = new Date("2026-06-15T12:00:00+12:00");

    expect(rollingCalendarWindowStart(now, 1)).toBe("2026-06-15");
    expect(rollingCalendarWindowStart(now, 7)).toBe("2026-06-09");
    expect(rollingCalendarWindowStart(now, 30)).toBe("2026-05-17");
    expect(rollingCalendarWindowStart(now, 365)).toBe("2025-06-16");
  });

  it("rejects empty windows", () => {
    expect(() => rollingCalendarWindowStart(new Date(), 0)).toThrow(RangeError);
  });
});
