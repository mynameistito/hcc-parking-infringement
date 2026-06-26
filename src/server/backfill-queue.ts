import type { BackfillMessage } from "@/backfill.ts";
import { BACKFILL_QUEUE_CONCURRENCY } from "@/lib/backfill-constants.ts";
import { mapWithConcurrency } from "@/lib/map-with-concurrency.ts";
import { getParkingStore } from "@/server/store.ts";
import { processBackfillMessage } from "@/server/sync.ts";

export type BackfillMessageOutcome =
  | {
      endDate: string;
      error: string;
      kind: "failed";
      startDate: string;
    }
  | {
      endDate: string;
      kind: "ingested";
      recordsFetched: number;
      startDate: string;
    }
  | {
      endDate: string;
      kind: "skipped";
      startDate: string;
    }
  | {
      endDate: string;
      kind: "split";
      startDate: string;
    };

const formatWindow = (startDate: string, endDate: string): string =>
  startDate === endDate ? startDate : `${startDate}–${endDate}`;

const handleBackfillMessage = async (
  message: Message<BackfillMessage>,
  env: Env
): Promise<BackfillMessageOutcome> => {
  const { endDate, startDate } = message.body;

  try {
    const outcome = await processBackfillMessage(env, message.body);
    message.ack();

    if (outcome.failed === true) {
      return {
        endDate,
        error: outcome.error ?? "unknown error",
        kind: "failed",
        startDate,
      };
    }

    if (outcome.split === true) {
      return { endDate, kind: "split", startDate };
    }

    if (outcome.skipped === true) {
      return { endDate, kind: "skipped", startDate };
    }

    if (outcome.result !== undefined) {
      return {
        endDate,
        kind: "ingested",
        recordsFetched: outcome.result.recordsFetched,
        startDate,
      };
    }

    return { endDate, kind: "skipped", startDate };
  } catch (error) {
    message.ack();
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      endDate,
      error: errorMessage,
      kind: "failed",
      startDate,
    };
  }
};

const logBackfillBatchSummary = (
  outcomes: readonly BackfillMessageOutcome[],
  statsFlushed: boolean
): void => {
  if (outcomes.length === 0) {
    return;
  }

  const ingested = outcomes.filter((outcome) => outcome.kind === "ingested");
  const splits = outcomes.filter((outcome) => outcome.kind === "split");
  const failed = outcomes.filter((outcome) => outcome.kind === "failed");
  const skipped = outcomes.filter((outcome) => outcome.kind === "skipped");
  let records = 0;
  for (const outcome of ingested) {
    records += outcome.recordsFetched;
  }

  const parts = [
    `${ingested.length}/${outcomes.length} windows`,
    `${records.toLocaleString()} records`,
  ];

  if (splits.length > 0) {
    parts.push(`${splits.length} split`);
  }
  if (failed.length > 0) {
    parts.push(`${failed.length} failed`);
  }
  if (skipped.length > 0) {
    parts.push(`${skipped.length} skipped`);
  }
  if (statsFlushed) {
    parts.push("stats flushed");
  }

  const ingestedWindows = ingested.map((outcome) =>
    formatWindow(outcome.startDate, outcome.endDate)
  );
  const range =
    ingestedWindows.length > 0
      ? ` (${ingestedWindows.at(0)}…${ingestedWindows.at(-1)})`
      : "";

  console.log(`[backfill] ${parts.join(" · ")}${range}`);

  for (const outcome of splits) {
    console.log(
      `[backfill] split ${formatWindow(outcome.startDate, outcome.endDate)} → daily jobs`
    );
  }

  for (const outcome of failed) {
    console.warn(
      `[backfill] skipped ${formatWindow(outcome.startDate, outcome.endDate)}: ${outcome.error}`
    );
  }
};

export const processBackfillQueueBatch = async (
  messages: readonly Message<BackfillMessage>[],
  env: Env
): Promise<void> => {
  if (messages.length === 0) {
    return;
  }

  const outcomes = await mapWithConcurrency(
    messages,
    BACKFILL_QUEUE_CONCURRENCY,
    async (message) => await handleBackfillMessage(message, env)
  );
  const { flushed } = await getParkingStore(env).flushBackfillDerivedState();
  logBackfillBatchSummary(outcomes, flushed);
};
