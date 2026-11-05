import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { BACKFILL_HCC_CONCURRENCY } from "@/lib/backfill-constants";
import {
  fetchAllInWindow,
  fetchInfringements,
  formatHccFetchError,
  HccClient,
  hccClientLayer,
} from "@/server/hcc-client";
import { HccTransport } from "@/server/hcc-transport";

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

describe("HCC pagination", () => {
  it("waits for all pages and reports the earliest page failure", async () => {
    const pageTwo = Promise.withResolvers<Response>();
    const pageThree = Promise.withResolvers<Response>();
    const bothStarted = Promise.withResolvers<void>();
    let started = 0;
    const fetchPage: typeof fetch = async (input) => {
      const url = input instanceof Request ? input.url : input;
      const page = Number(new URL(url).searchParams.get("Page"));
      if (page === 1) {
        return Response.json({
          Paging: [{ Current_Page: 1, Page_Count: 3, Page_Size: 1 }],
        });
      }
      started += 1;
      if (started === 2) bothStarted.resolve();
      return await (page === 2 ? pageTwo.promise : pageThree.promise);
    };
    let settled = false;
    const result = fetchAllInWindow(env, request.startDate, request.endDate, {
      fetch: fetchPage,
    }).then((value) => {
      settled = true;
      return value;
    });
    await bothStarted.promise;
    pageThree.resolve(new Response("page 3", { status: 503 }));
    await Promise.resolve();
    expect(settled).toBe(false);
    pageTwo.resolve(new Response("page 2", { status: 429 }));
    expect(await result).toEqual({
      ok: false,
      error: { tag: "http", status: 429, body: "page 2" },
    });
  });
});

describe("HccClient service", () => {
  it("aggregates pages through its supplied transport", async () => {
    const transport = Layer.succeed(
      HccTransport,
      HccTransport.of({
        fetchPage: (_start, _end, page) =>
          Effect.succeed({
            Data: [{ page }],
            Paging: [{ Current_Page: page, Page_Count: 2, Page_Size: 1 }],
          }),
      })
    );
    const result = await Effect.runPromise(
      Effect.gen(function* runFetch() {
        const client = yield* HccClient;
        return yield* client.fetchAll(request.startDate, request.endDate);
      }).pipe(Effect.provide(hccClientLayer.pipe(Layer.provide(transport))))
    );
    expect(result.records).toEqual([{ page: 1 }, { page: 2 }]);
    expect(result.possiblyTruncated).toBe(true);
  });
});
