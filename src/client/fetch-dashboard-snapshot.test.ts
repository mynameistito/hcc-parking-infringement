import { once } from "node:events";
import { createServer } from "node:http";

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { fetchDashboardSnapshot } from "./fetch-dashboard-snapshot";

const minimalFullMessage = {
  at: "2026-01-01T00:00:00.000+13:00",
  chartBreakdowns: {
    offenceCategories: [{ count: 1, label: "Parking" }],
    offences: [{ count: 1, label: "Parked in a clearway" }],
    suburbs: [{ count: 1, label: "CBD" }],
    towed: [{ count: 1, label: "Not towed" }],
    vehicleMakes: [{ count: 1, label: "Toyota" }],
    vehicleTypes: [{ count: 1, label: "Car" }],
  },
  dailyTrend: [{ count: 1, date: "2026-01-01", totalCents: 100 }],
  live: {
    allTimeAmountCents: 100,
    allTimeTotal: 1,
    last24h: 1,
    last30d: 1,
    last365d: 1,
    last7d: 1,
    lastRecordAt: null,
    lastSyncedAt: "2026-01-01T00:00:00.000+13:00",
    thisMonth: 1,
    today: 1,
    towedToday: 0,
  },
  map: { pendingGeocode: 0, routes: [] },
  paceTrends: {
    last30d: { current: 1, direction: "flat", percent: 0, previous: 1 },
    last365d: { current: 1, direction: "flat", percent: 0, previous: 1 },
    last7d: { current: 1, direction: "flat", percent: 0, previous: 1 },
  },
  recentInfringements: [],
  streets: [],
  suburbs: [],
  topOffences: [],
  topStreets: [],
  type: "full" as const,
  vehicles: [],
};

const withResponse = async (
  body: string,
  status: number,
  check: (url: string) => Promise<void>
): Promise<void> => {
  const server = createServer((_request, response) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(body);
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = z.object({ port: z.number() }).parse(server.address());
    await check(`http://127.0.0.1:${address.port}/dashboard`);
  } finally {
    server.closeAllConnections();
    const closed = once(server, "close");
    server.close();
    await closed;
  }
};

describe(fetchDashboardSnapshot, () => {
  it("loads a validated dashboard over HTTP without a WebSocket", async () => {
    await withResponse(JSON.stringify(minimalFullMessage), 200, async (url) => {
      const result = await fetchDashboardSnapshot(
        url,
        AbortSignal.timeout(5000)
      );

      expect(result).toMatchObject({
        ok: true,
        value: { live: { allTimeTotal: 1 } },
      });
    });
  });

  it("returns an HTTP failure without trusting an error response as data", async () => {
    await withResponse(JSON.stringify(minimalFullMessage), 503, async (url) => {
      await expect(
        fetchDashboardSnapshot(url, AbortSignal.timeout(5000))
      ).resolves.toStrictEqual({ error: "http", ok: false });
    });
  });

  it.each(["{", '{"type":"partial"}'])(
    "rejects an invalid snapshot: %s",
    async (body) => {
      await withResponse(body, 200, async (url) => {
        await expect(
          fetchDashboardSnapshot(url, AbortSignal.timeout(5000))
        ).resolves.toStrictEqual({ error: "invalid", ok: false });
      });
    }
  );

  it("returns a failure when its owner cancels the request", async () => {
    await withResponse(JSON.stringify(minimalFullMessage), 200, async (url) => {
      await expect(
        fetchDashboardSnapshot(url, AbortSignal.abort())
      ).resolves.toStrictEqual({ error: "network", ok: false });
    });
  });
});
