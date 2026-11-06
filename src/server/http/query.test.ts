import { describe, expect, it } from "vitest";

import {
  parseBackfillChunkDays,
  parseNonNegativeInt,
  parsePositiveInt,
} from "./query";

describe("integer query parameters", () => {
  it("accepts an integer prefix before trailing text", () => {
    expect(parsePositiveInt("12days", 1)).toBe(12);
    expect(parseNonNegativeInt("0days", 1)).toBe(0);
    expect(parseBackfillChunkDays(undefined, "7days")).toBe(7);
  });
});
