import { once } from "node:events";
import { createServer } from "node:http";

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { CleanInfringement } from "@/server/clean-schema.ts";
import {
  buildLiveSeedSnapshot,
  refreshLiveSeedChunkFromHcc,
} from "@/server/live-seed-refresh.ts";

const makeRecord = (
  infringementNumber: number,
  occurredAt: string,
  overrides: Partial<CleanInfringement> = {}
): CleanInfringement => ({
  additionalCostsCents: 0,
  amountCents: 4000,
  closedAt: null,
  courtServeMethod: null,
  infringementNumber,
  infringementType: null,
  isTowed: false,
  occurredAt,
  offenceCategory: "Parking",
  offenceCode: "P101",
  offenceDescription: "No valid parking payment",
  postCode: null,
  street: "Victoria Street",
  suburb: "Hamilton Central",
  town: "Hamilton",
  vehicleColour: null,
  vehicleMake: "Toyota",
  vehicleModel: "Corolla",
  vehicleType: "Car",
  ...overrides,
});

describe(buildLiveSeedSnapshot, () => {
  it("uses one supplied instant for rolling windows across Auckland midnight", () => {
    const snapshot = buildLiveSeedSnapshot({
      existingLive: null,
      from: "2026-06-24",
      now: new Date("2026-06-30T12:00:00Z"),
      records: [
        makeRecord(1, "2026-06-24T23:59:59+12:00"),
        makeRecord(2, "2026-06-25T00:00:00+12:00"),
        makeRecord(3, "2026-06-30T23:59:59+12:00"),
        makeRecord(4, "2026-07-01T00:00:00+12:00"),
      ],
      syncedAt: "2026-07-01T00:00:00+12:00",
      to: "2026-07-01",
    });

    expect(snapshot.live.last7d).toBe(3);
    expect(snapshot.live.last24h).toBe(2);
    expect(snapshot.live.today).toBe(1);
  });

  it("deduplicates records and builds dashboard aggregates", () => {
    const snapshot = buildLiveSeedSnapshot({
      existingLive: {
        allTimeAmountCents: 100_000,
        allTimeTotal: 100,
        last24h: 0,
        last30d: 0,
        last365d: 0,
        last7d: 0,
        lastRecordAt: null,
        lastSyncedAt: "2026-06-30T00:00:00.000+12:00",
        thisMonth: 0,
        today: 0,
        towedToday: 0,
      },
      from: "2026-06-29",
      now: new Date("2026-07-01T00:00:00Z"),
      records: [
        makeRecord(1, "2026-06-29T10:00:00+12:00"),
        makeRecord(2, "2026-07-01T09:00:00+12:00", { isTowed: true }),
        makeRecord(2, "2026-07-01T09:00:00+12:00", { isTowed: true }),
      ],
      syncedAt: "2026-07-01T12:00:00.000+12:00",
      to: "2026-07-01",
    });

    expect(snapshot.live).toMatchObject({
      allTimeTotal: 100,
      today: 1,
      towedToday: 1,
    });
    expect(snapshot.dailyTrend).toStrictEqual([
      { count: 1, date: "2026-06-29", totalCents: 4000 },
      { count: 0, date: "2026-06-30", totalCents: 0 },
      { count: 1, date: "2026-07-01", totalCents: 4000 },
    ]);
    expect(snapshot.recentInfringements).toHaveLength(2);
    expect(snapshot.streets[0]).toMatchObject({
      count: 2,
      label: "Victoria Street",
      street: "Victoria Street",
    });
  });
});

describe(refreshLiveSeedChunkFromHcc, () => {
  it("keeps persisted plan cutoffs when chunk work crosses Auckland midnight", async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          Data: [
            {
              Infringement_Amount: 40,
              Infringement_Date: "2026-06-24",
              Infringement_Number: 1,
              Infringement_Time: "12:00:00",
            },
            {
              Infringement_Amount: 40,
              Infringement_Date: "2026-06-30",
              Infringement_Number: 2,
              Infringement_Time: "00:00:00",
            },
          ],
          Paging: [{ Current_Page: 1, Page_Count: 1, Page_Size: 100 }],
        })
      );
    });

    try {
      server.listen(0, "127.0.0.1");
      await once(server, "listening");
      const address = z.object({ port: z.number() }).parse(server.address());

      const bucket = {
        get: async () => await Promise.resolve(null),
        put: async () => await Promise.resolve(null),
      };

      const env = {
        HCC_API_BASE: `http://127.0.0.1:${address.port}`,
        PARKING_SEED: bucket,
      };

      const options = {
        bootstrapAfter: null,
        chunk: "chunk.ndjson",
        prefix: "seed",
        publishedInfringementNumbers: [],
        syncedAt: "2026-06-30T23:59:59+12:00",
        to: "2026-06-30",
        window: { end: "2026-06-30", start: "2026-06-24" },
      };

      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-06-30T11:59:59Z"));
      const first = await refreshLiveSeedChunkFromHcc(env, options);
      vi.setSystemTime(new Date("2026-06-30T12:00:01Z"));
      const second = await refreshLiveSeedChunkFromHcc(env, options);
      expect([first.last7d, second.last7d]).toStrictEqual([2, 2]);
      expect([first.last24h, second.last24h]).toStrictEqual([1, 1]);
      expect(first.lastHccFetchAt).not.toBe(second.lastHccFetchAt);
    } finally {
      vi.useRealTimers();
      const closed = once(server, "close");
      server.close();
      await closed;
    }
  });
});
