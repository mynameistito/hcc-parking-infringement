import { describe, expect, it } from "vitest";

import {
  addDaysInAuckland,
  dateBounds,
  endOfDayInAucklandIso,
  formatAucklandDateKey,
  formatDateInAuckland,
  instantInAucklandIso,
  localDateTimeInAucklandIso,
  monthBoundsInAuckland,
  normalizeOptionalAucklandInstant,
  nowInAucklandIso,
  rollingHoursBoundsInAuckland,
  startOfDayInAucklandIso,
  todayInAuckland,
  yearBoundsInAuckland,
} from "@/lib/auckland-time";
import { toIsoOccurredAt } from "@/server/clean-normalize";

describe("nowInAucklandIso", () => {
  it("returns an Auckland offset, not UTC Z", () => {
    const value = nowInAucklandIso();
    expect(value).toMatch(/[+-]\d{2}:\d{2}$/u);
    expect(value.includes("Z")).toBe(false);
  });
});

describe("startOfDayInAucklandIso", () => {
  it("uses +13:00 during NZDT (summer)", () => {
    expect(startOfDayInAucklandIso("2026-01-15")).toBe(
      "2026-01-15T00:00:00+13:00"
    );
  });

  it("uses +12:00 during NZST (winter)", () => {
    expect(startOfDayInAucklandIso("2026-06-15")).toBe(
      "2026-06-15T00:00:00+12:00"
    );
  });
});

describe("endOfDayInAucklandIso", () => {
  it("uses the correct DST offset at end of day", () => {
    expect(endOfDayInAucklandIso("2026-01-15")).toBe(
      "2026-01-15T23:59:59.999+13:00"
    );
    expect(endOfDayInAucklandIso("2026-06-15")).toBe(
      "2026-06-15T23:59:59.999+12:00"
    );
  });
});

describe("localDateTimeInAucklandIso", () => {
  it("applies NZDT offset to local infringement times", () => {
    expect(localDateTimeInAucklandIso("2026-01-15", "10:30")).toBe(
      "2026-01-15T10:30:00+13:00"
    );
  });

  it("normalizes HH:mm times", () => {
    expect(localDateTimeInAucklandIso("2026-06-15", "09:05")).toBe(
      "2026-06-15T09:05:00+12:00"
    );
  });

  it("matches clean-normalize export", () => {
    expect(toIsoOccurredAt("2026-06-15", "09:05:00")).toBe(
      "2026-06-15T09:05:00+12:00"
    );
  });
});

describe("normalizeOptionalAucklandInstant", () => {
  it("expands date-only values to end-of-day Auckland ISO", () => {
    expect(normalizeOptionalAucklandInstant("2026-01-15")).toBe(
      "2026-01-15T23:59:59.999+13:00"
    );
  });

  it("returns null for empty values", () => {
    expect(normalizeOptionalAucklandInstant("")).toBeNull();
    expect(normalizeOptionalAucklandInstant(null)).toBeNull();
  });
});

describe("addDaysInAuckland", () => {
  it("steps calendar days in Auckland time", () => {
    expect(addDaysInAuckland("2026-06-15", 1)).toBe("2026-06-16");
    expect(addDaysInAuckland("2026-06-15", -1)).toBe("2026-06-14");
  });
});

describe("dateBounds", () => {
  it("returns start and end with matching offsets", () => {
    const bounds = dateBounds("2026-01-15");
    expect(bounds.start).toBe("2026-01-15T00:00:00+13:00");
    expect(bounds.end).toBe("2026-01-15T23:59:59.999+13:00");
  });
});

describe("rollingHoursBoundsInAuckland", () => {
  it("expresses both bounds in Auckland offset form", () => {
    const now = new Date("2026-06-26T00:00:00+12:00");
    const bounds = rollingHoursBoundsInAuckland(now, 24);

    expect(bounds.end).toMatch(/\+12:00$/u);
    expect(bounds.start).toMatch(/\+12:00$/u);
    expect(bounds.start < bounds.end).toBe(true);
  });
});

describe("monthBoundsInAuckland", () => {
  it("covers the full calendar month in Auckland", () => {
    const bounds = monthBoundsInAuckland(new Date("2026-06-15T12:00:00Z"));
    expect(bounds.start).toBe("2026-06-01T00:00:00+12:00");
    expect(bounds.end).toBe("2026-06-30T23:59:59.999+12:00");
  });
});

describe("yearBoundsInAuckland", () => {
  it("covers the full calendar year in Auckland", () => {
    const bounds = yearBoundsInAuckland(new Date("2026-06-15T12:00:00Z"));
    expect(bounds.start).toBe("2026-01-01T00:00:00+13:00");
    expect(bounds.end).toBe("2026-12-31T23:59:59.999+13:00");
  });
});

describe("formatDateInAuckland", () => {
  it("formats today as YYYY-MM-DD", () => {
    expect(todayInAuckland(new Date("2026-06-26T12:00:00Z"))).toMatch(
      /^\d{4}-\d{2}-\d{2}$/u
    );
    expect(formatDateInAuckland(new Date("2026-06-26T12:00:00Z"))).toBe(
      "2026-06-27"
    );
  });
});

describe("formatAucklandDateKey", () => {
  it("formats calendar keys in Pacific/Auckland", () => {
    expect(formatAucklandDateKey("2026-06-15", "EEE").toUpperCase()).toBe(
      "MON"
    );
  });
});

describe("instantInAucklandIso", () => {
  it("includes Auckland offset", () => {
    expect(instantInAucklandIso(new Date("2026-06-26T00:00:00Z"))).toBe(
      "2026-06-26T12:00:00.000+12:00"
    );
  });
});
