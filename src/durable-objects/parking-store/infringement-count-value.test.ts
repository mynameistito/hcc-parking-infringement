import { describe, expect, it } from "vitest";

import { parseCachedInfringementCount } from "./infringement-count-value";

describe("cached infringement count parsing", () => {
  it("preserves decimal-prefix parsing for stored values", () => {
    expect(parseCachedInfringementCount("12x")).toBe(12);
    expect(parseCachedInfringementCount("0x10")).toBe(0);
    expect(parseCachedInfringementCount(" 42 ")).toBe(42);
  });

  it("returns null for absent, empty, or negative values", () => {
    expect(parseCachedInfringementCount(null)).toBeNull();
    expect(parseCachedInfringementCount("")).toBeNull();
    expect(parseCachedInfringementCount("   ")).toBeNull();
    expect(parseCachedInfringementCount("-1")).toBeNull();
  });
});
