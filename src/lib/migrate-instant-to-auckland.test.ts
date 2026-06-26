import { describe, expect, it } from "vitest";

import { isAucklandInstant, parseAucklandInstant } from "@/lib/auckland-time";
import {
  migrateOptionalClosedAt,
  migrateSyncInstant,
  migrateWallClockInstant,
} from "@/lib/migrate-instant-to-auckland";

describe("migrateWallClockInstant", () => {
  it("fixes NZDT rows stored with +12:00 offset", () => {
    const migrated = migrateWallClockInstant("2026-01-15T10:30:00+12:00");
    expect(migrated).toBe("2026-01-15T10:30:00+13:00");
    expect(isAucklandInstant(migrated)).toBe(true);
  });

  it("converts legacy UTC Z infringement timestamps", () => {
    const migrated = migrateWallClockInstant("2026-06-26T00:00:00.000Z");
    expect(migrated).toBe("2026-06-26T12:00:00.000+12:00");
  });
});

describe("migrateSyncInstant", () => {
  it("converts legacy UTC Z sync timestamps", () => {
    const migrated = migrateSyncInstant("2026-01-01T00:00:00.000Z");
    expect(migrated).toBe("2026-01-01T13:00:00.000+13:00");
    expect(isAucklandInstant(migrated)).toBe(true);
  });

  it("expands date-only sync timestamps to start of day", () => {
    expect(migrateSyncInstant("2026-06-15")).toBe("2026-06-15T00:00:00+12:00");
  });
});

describe("migrateOptionalClosedAt", () => {
  it("expands date-only closed dates to end of day", () => {
    expect(migrateOptionalClosedAt("2026-01-15")).toBe(
      "2026-01-15T23:59:59.999+13:00"
    );
  });
});

describe("parseAucklandInstant", () => {
  it("rejects legacy UTC Z strings after migration", () => {
    expect(() => parseAucklandInstant("2026-01-01T00:00:00.000Z")).toThrow(
      TypeError
    );
  });

  it("accepts migrated Auckland instants", () => {
    expect(
      parseAucklandInstant("2026-06-15T09:05:00+12:00").getTime()
    ).toBeTypeOf("number");
  });
});
