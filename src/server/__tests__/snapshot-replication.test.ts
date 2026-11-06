import { once } from "node:events";
import { createServer } from "node:http";

import { syncSnapshotBetweenWorkers } from "@scripts/lib/replication/sync.ts";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  cleanInfringementSchema,
  rawInfringementSchema,
} from "@/server/clean-schema.ts";
import type { CleanInfringement } from "@/server/clean-schema.ts";
import { cleanInfringement } from "@/server/clean.ts";

const watermarkSchema = z.object({
  end: z.string(),
  ingestedAt: z.string(),
  recordCount: z.number(),
  start: z.string(),
});

const makeRecord = (infringementNumber: number): CleanInfringement =>
  cleanInfringement(
    rawInfringementSchema.parse({
      Infringement_Amount: 40,
      Infringement_Date: "2026-06-01",
      Infringement_Number: infringementNumber,
      Infringement_Time: "10:00:00",
    })
  );

const createWorkerFixture = (records: CleanInfringement[]) => {
  const imported: CleanInfringement[] = [];
  const importedWatermarks: z.infer<typeof watermarkSchema>[] = [];
  const cursors: number[] = [];
  const offsets: number[] = [];
  let finalized = false;

  const watermarks = [
    {
      end: "2026-06-01",
      ingestedAt: "2026-06-02T00:00:00+12:00",
      recordCount: records.length,
      start: "2026-06-01",
    },
    {
      end: "2026-06-02",
      ingestedAt: "2026-06-03T00:00:00+12:00",
      recordCount: 0,
      start: "2026-06-02",
    },
  ];

  const server = createServer((request, response) => {
    request.setEncoding("utf-8");
    let body = "";
    request.on("data", (chunk: string) => {
      body += chunk;
    });
    request.on("end", () => {
      response.setHeader("Content-Type", "application/json");

      if (request.headers.authorization !== "Bearer fixture") {
        response.statusCode = 401;
        response.end("{}");

        return;
      }

      const url = new URL(request.url ?? "/", "http://127.0.0.1");

      if (url.pathname.endsWith("/export/infringements")) {
        const after = Number(url.searchParams.get("after"));
        cursors.push(after);

        const remaining = records.filter(
          (record) => record.infringementNumber > after
        );

        const page = remaining.slice(0, 2);
        const last = page.at(-1);

        const nextCursor =
          remaining.length > page.length && last !== undefined
            ? last.infringementNumber
            : null;

        response.end(
          JSON.stringify({ nextCursor, records: page, total: records.length })
        );
      } else if (url.pathname.endsWith("/import/snapshot")) {
        const parsed = z
          .object({ infringements: z.array(cleanInfringementSchema) })
          .parse(JSON.parse(body));

        imported.push(...parsed.infringements);
        response.end(
          JSON.stringify({
            recordsReceived: parsed.infringements.length,
            recordsUpserted: parsed.infringements.length,
          })
        );
      } else if (url.pathname.endsWith("/export/watermarks")) {
        const offset = Number(url.searchParams.get("offset"));
        offsets.push(offset);
        const nextOffset = offset + 1 < watermarks.length ? offset + 1 : null;
        response.end(
          JSON.stringify({
            nextOffset,
            total: watermarks.length,
            watermarks: watermarks.slice(offset, offset + 1),
          })
        );
      } else if (url.pathname.endsWith("/import/watermarks")) {
        const parsed = z
          .object({ watermarks: z.array(watermarkSchema) })
          .parse(JSON.parse(body));

        importedWatermarks.push(...parsed.watermarks);
        response.end("{}");
      } else if (url.pathname.endsWith("/import/stored/finalize")) {
        finalized = true;
        response.end("{}");
      } else {
        response.statusCode = 404;
        response.end("{}");
      }
    });
  });

  return {
    cursors,
    imported,
    importedWatermarks,
    isFinalized: () => finalized,
    offsets,
    server,
    watermarks,
  };
};

describe("snapshot replication pagination", () => {
  it.each([0, 3])(
    "copies %i records and finishes at the last page",
    async (count) => {
      const records = Array.from({ length: count }, (_, index) =>
        makeRecord(index + 1)
      );

      const fixture = createWorkerFixture(records);
      fixture.server.listen(0, "127.0.0.1");
      await once(fixture.server, "listening");

      const address = z
        .object({ port: z.number() })
        .parse(fixture.server.address());

      const worker = {
        apiKey: "fixture",
        workerUrl: `http://127.0.0.1:${address.port}`,
      };

      try {
        const result = await syncSnapshotBetweenWorkers(worker, worker, {
          batchSize: 2,
          label: "fixture",
          pauseMs: 0,
          skipWatermarks: false,
          startAfter: 0,
        });

        expect(result).toStrictEqual({
          totalInfringements: count,
          uploadedInfringements: count,
          uploadedWatermarks: 2,
        });
        expect(fixture.imported).toStrictEqual(records);
        expect(fixture.importedWatermarks).toStrictEqual(fixture.watermarks);
        expect({
          cursors: fixture.cursors,
          finalized: fixture.isFinalized(),
          offsets: fixture.offsets,
        }).toStrictEqual({
          cursors: count === 0 ? [0] : [0, 2],
          finalized: true,
          offsets: [0, 1],
        });
      } finally {
        const closed = once(fixture.server, "close");
        fixture.server.close();
        await closed;
      }
    }
  );
});
