import { describe, expect, it } from "vitest";

import { formatHccFetchError } from "@/server/hcc-client";

describe("formatHccFetchError", () => {
  it("formats HTTP failures", () => {
    expect(
      formatHccFetchError({ body: "rate limited", status: 429, tag: "http" })
    ).toContain("429");
  });

  it("formats malformed response failures", () => {
    expect(
      formatHccFetchError({ detail: "Paging missing", tag: "malformed" })
    ).toContain("Paging missing");
  });
});
