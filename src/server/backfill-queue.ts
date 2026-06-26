import type { BackfillMessage, LegacyBackfillMessage } from "@/backfill.ts";
import { expandBackfillMessage } from "@/backfill.ts";
import { BACKFILL_QUEUE_CONCURRENCY } from "@/lib/backfill-constants.ts";
import { mapWithConcurrency } from "@/lib/map-with-concurrency.ts";
import { isRetryableError } from "@/lib/transient-error.ts";
import type { AppScope } from "@/server/app-scope.ts";
import { createAppScope } from "@/server/app-scope.ts";
import { flushBackfillDerivedStateSafely } from "@/server/backfill-flush.ts";
import { processBackfillMessage } from "@/server/sync-backfill.ts";

const BACKFILL_RETRY_DELAY_SECONDS = 30;

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
      kind: "retrying";
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

const settleBackfillMessage = (
  message: Message<BackfillMessage | LegacyBackfillMessage>,
  action: "ack" | "retry"
): void => {
  const windows = expandBackfillMessage(message.body);
  const [firstWindow] = windows;

  try {
    if (action === "retry") {
      message.retry({ delaySeconds: BACKFILL_RETRY_DELAY_SECONDS });
      return;
    }

    message.ack();
  } catch (settleError) {
    console.error("[backfill] failed to settle queue message", {
      action,
      error:
        settleError instanceof Error
          ? settleError.message
          : String(settleError),
      messageId: message.id,
      window:
        firstWindow === undefined
          ? "unknown"
          : formatWindow(firstWindow.startDate, firstWindow.endDate),
      windowCount: windows.length,
    });
  }
};

const mapProcessOutcome = (
  startDate: string,
  endDate: string,
  outcome: Awaited<ReturnType<typeof processBackfillMessage>>
): BackfillMessageOutcome => {
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
};

const handleBackfillQueueMessage = async (
  message: Message<BackfillMessage | LegacyBackfillMessage>,
  scope: AppScope
): Promise<BackfillMessageOutcome[]> => {
  const windows = expandBackfillMessage(message.body);

  try {
    const outcomes = await mapWithConcurrency(
      windows,
      BACKFILL_QUEUE_CONCURRENCY,
      async (window) => {
        const outcome = await processBackfillMessage(scope, {
          delivery: "queue",
          endDate: window.endDate,
          force: window.force,
          startDate: window.startDate,
        });
        return mapProcessOutcome(window.startDate, window.endDate, outcome);
      }
    );

    settleBackfillMessage(message, "ack");
    return outcomes;
  } catch (error) {
    const [firstWindow] = windows;
    const startDate = firstWindow?.startDate ?? "unknown";
    const endDate = firstWindow?.endDate ?? "unknown";
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (isRetryableError(error)) {
      settleBackfillMessage(message, "retry");
      console.warn(
        `[backfill] retrying ${windows.length} windows from ${formatWindow(startDate, endDate)}: ${errorMessage}`
      );
      return [{ endDate, kind: "retrying", startDate }];
    }

    settleBackfillMessage(message, "ack");
    return [
      {
        endDate,
        error: errorMessage,
        kind: "failed",
        startDate,
      },
    ];
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
  const retried = outcomes.filter((outcome) => outcome.kind === "retrying");
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
  if (retried.length > 0) {
    parts.push(`${retried.length} retrying`);
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
  messages: readonly Message<BackfillMessage | LegacyBackfillMessage>[],
  env: Env
): Promise<void> => {
  if (messages.length === 0) {
    return;
  }

  const scope = createAppScope(env);

  const nestedOutcomes = await mapWithConcurrency(
    messages,
    BACKFILL_QUEUE_CONCURRENCY,
    async (message) => await handleBackfillQueueMessage(message, scope)
  );
  const outcomes = nestedOutcomes.flat();
  const { flushed } = await flushBackfillDerivedStateSafely(scope.env);
  logBackfillBatchSummary(outcomes, flushed);
};
