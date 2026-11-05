import { describe, expect, it } from "vitest";

import { BACKFILL_HCC_CONCURRENCY } from "@/lib/backfill-constants";
import {
  fetchAllInWindow,
  fetchInfringements,
  formatHccFetchError,
} from "@/server/hcc-client";

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

const env = { HCC_API_BASE: "https://api.hcc.govt.nz/OpenData" } as const;
const request = { endDate: "2026-01-02", page: 1, startDate: "2026-01-01" };
const failed: typeof fetch = async () =>
  await Promise.reject(new TypeError("offline"));
const malformed: typeof fetch = async () =>
  await Promise.resolve(new Response("{"));

describe("HCC request boundary", () => {
  it("returns typed transport and malformed JSON failures", async () => {
    expect(
      await fetchInfringements(env, { ...request, fetch: failed })
    ).toEqual({ error: { tag: "transport" }, ok: false });
    expect(
      await fetchInfringements(env, { ...request, fetch: malformed })
    ).toEqual({ error: { tag: "malformed_json" }, ok: false });
  });

  it("propagates cancellation through pagination", async () => {
    const controller = new AbortController();
    const observed: (AbortSignal | null | undefined)[] = [];
    const fetchPage: typeof fetch = async (input, init) => {
      observed.push(init?.signal);
      const url = input instanceof Request ? input.url : input;
      const page = new URL(url).searchParams.get("Page");
      if (page !== "1") {
        controller.abort();
      }
      if (controller.signal.aborted) {
        return await Promise.reject(new Error("aborted"));
      }
      return await Promise.resolve(
        Response.json({
          Data: [],
          Paging: [{ Current_Page: 1, Page_Count: 2, Page_Size: 1 }],
        })
      );
    };
    expect(
      await fetchAllInWindow(env, request.startDate, request.endDate, {
        fetch: fetchPage,
        signal: controller.signal,
      })
    ).toEqual({ error: { tag: "cancelled" }, ok: false });
    expect(observed).toEqual([controller.signal, controller.signal]);
  });

  it("removes a cancelled waiter and lets the next request acquire the slot", async () => {
    const releases: (() => void)[] = [];
    const blocked: typeof fetch = async () => {
      const { promise, resolve } = Promise.withResolvers<Response>();
      releases.push(() => {
        resolve(
          Response.json({
            Paging: [{ Current_Page: 1, Page_Count: 1, Page_Size: 1 }],
          })
        );
      });
      return await promise;
    };
    const active = Array.from(
      { length: BACKFILL_HCC_CONCURRENCY },
      async () => await fetchInfringements(env, { ...request, fetch: blocked })
    );
    await Promise.resolve();
    const controller = new AbortController();
    const cancelled = fetchInfringements(env, {
      ...request,
      fetch: blocked,
      signal: controller.signal,
    });
    const next = fetchInfringements(env, { ...request, fetch: blocked });
    controller.abort();
    expect(await cancelled).toEqual({ error: { tag: "cancelled" }, ok: false });
    releases[0]?.();
    await active[0];
    await Promise.resolve();
    expect(releases).toHaveLength(BACKFILL_HCC_CONCURRENCY + 1);
    for (const release of releases.slice(1)) {
      release();
    }
    const nextResult = await next;
    expect(nextResult.ok).toBe(true);
    await Promise.all(active);
  });
});
