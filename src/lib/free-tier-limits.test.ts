import { describe, expect, it } from "vitest";

import {
  FREE_TIER_DO_DAILY_WRITE_BUDGET,
  FREE_TIER_QUEUE_DAILY_OP_BUDGET,
  isFreeTierMode,
  parseFreeTierMode,
  resolveBackfillTuning,
} from "./free-tier-limits.ts";

describe(parseFreeTierMode, () => {
  it("accepts common truthy values", () => {
    expect(parseFreeTierMode("true")).toBeTruthy();
    expect(parseFreeTierMode("1")).toBeTruthy();
    expect(parseFreeTierMode("yes")).toBeTruthy();
  });

  it("treats missing or false values as disabled", () => {
    expect(parseFreeTierMode()).toBeFalsy();
    expect(parseFreeTierMode("false")).toBeFalsy();
  });
});

describe(resolveBackfillTuning, () => {
  it("uses conservative queue and concurrency limits on the free plan", () => {
    const env = {
      FREE_TIER_MODE: "true",
    };

    expect(isFreeTierMode(env)).toBeTruthy();
    expect(resolveBackfillTuning(env)).toStrictEqual({
      hccConcurrency: 2,
      maxDirectPerWave: 4,
      maxEnqueuePerWave: 60,
      queueConcurrency: 1,
      queueWindowsPerMessage: 20,
    });
  });

  it("keeps production throughput when free-tier mode is off", () => {
    const env = {
      FREE_TIER_MODE: "false",
    };

    expect(resolveBackfillTuning(env).maxEnqueuePerWave).toBe(3000);
  });
});

describe("free-tier budgets", () => {
  it("reserves headroom below Cloudflare hard limits", () => {
    expect(FREE_TIER_DO_DAILY_WRITE_BUDGET).toBeLessThan(100_000);
    expect(FREE_TIER_QUEUE_DAILY_OP_BUDGET).toBeLessThan(10_000);
  });
});
