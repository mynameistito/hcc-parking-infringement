import { describe, expect, it } from "vitest";

import { splitDateRange } from "@/server/sync-window";

describe("splitDateRange", () => {
  it("splits an inclusive range into chunk windows", () => {
    expect(splitDateRange("2024-01-01", "2024-01-10", 3)).toEqual([
      { end: "2024-01-03", start: "2024-01-01" },
      { end: "2024-01-06", start: "2024-01-04" },
      { end: "2024-01-09", start: "2024-01-07" },
      { end: "2024-01-10", start: "2024-01-10" },
    ]);
  });
});
