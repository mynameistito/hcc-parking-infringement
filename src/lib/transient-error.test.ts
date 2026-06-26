import { describe, expect, it } from "vitest";

import { isRetryableError } from "./transient-error.ts";

describe("isRetryableError", () => {
  it("treats durable object and network failures as retryable", () => {
    expect(isRetryableError(new Error("failed to reach Durable Object"))).toBe(
      true
    );
    expect(isRetryableError(new Error("network connection lost"))).toBe(true);
    expect(isRetryableError(new Error("HCC API error 503: upstream"))).toBe(
      true
    );
    expect(isRetryableError(new Error("HCC API error 429: rate limited"))).toBe(
      true
    );
  });

  it("treats business failures as non-retryable", () => {
    expect(
      isRetryableError(
        new Error("HCC day 2024-01-01 exceeds page limit (10000 records)")
      )
    ).toBe(false);
    expect(isRetryableError(new Error("HCC API error 400: bad request"))).toBe(
      false
    );
    expect(
      isRetryableError(new Error("HCC API response missing Paging metadata"))
    ).toBe(false);
  });
});
