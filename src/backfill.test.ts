import { describe, expect, it } from "vitest";

import {
  expandBackfillMessage,
  packBackfillQueueMessages,
} from "@/backfill.ts";

describe("packBackfillQueueMessages", () => {
  it("packs windows into fewer queue messages", () => {
    const windows = Array.from({ length: 120 }, (_, index) => ({
      endDate: `2024-01-${String((index % 28) + 1).padStart(2, "0")}`,
      startDate: `2024-01-${String((index % 28) + 1).padStart(2, "0")}`,
    }));

    const messages = packBackfillQueueMessages(windows, {
      windowsPerMessage: 50,
    });

    expect(messages).toHaveLength(3);
    expect(messages[0]?.windows).toHaveLength(50);
    expect(messages[2]?.windows).toHaveLength(20);
  });
});

describe("expandBackfillMessage", () => {
  it("supports legacy single-window queue payloads", () => {
    expect(
      expandBackfillMessage({
        endDate: "2024-01-07",
        startDate: "2024-01-01",
      })
    ).toEqual([
      {
        endDate: "2024-01-07",
        startDate: "2024-01-01",
      },
    ]);
  });
});
