import { app } from "@/app.ts";
import type { BackfillMessage } from "@/backfill.ts";
import { ParkingStore } from "@/durable-objects/parking-store.ts";
import { BACKFILL_QUEUE_CONCURRENCY } from "@/lib/backfill-constants.ts";
import { mapWithConcurrency } from "@/lib/map-with-concurrency.ts";
import { geocodeMissingLocations } from "@/server/geocode.ts";
import { hourlySync, processBackfillMessage } from "@/server/sync.ts";

export { ParkingStore };

const handleBackfillMessage = async (
  message: Message<BackfillMessage>,
  env: Env
): Promise<void> => {
  try {
    const outcome = await processBackfillMessage(env, message.body);

    if (outcome.failed === true) {
      console.error(
        "backfill skipped failed day",
        message.body.startDate,
        outcome.error
      );
    } else if (outcome.split === true) {
      console.log(
        "split backfill window into daily jobs",
        message.body.startDate,
        message.body.endDate
      );
    } else if (outcome.result !== undefined) {
      console.log(
        "backfill window complete",
        message.body.startDate,
        message.body.endDate,
        `${outcome.result.recordsFetched} records`
      );
    }

    message.ack();
  } catch (error) {
    console.error(
      "backfill message failed — skipping day",
      message.body,
      error
    );
    message.ack();
  }
};

const processBackfillBatch = async (
  messages: readonly Message<BackfillMessage>[],
  env: Env
): Promise<void> => {
  await mapWithConcurrency(
    messages,
    BACKFILL_QUEUE_CONCURRENCY,
    async (message) => {
      await handleBackfillMessage(message, env);
    }
  );
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/v1/")) {
      return await env.ASSETS.fetch(request.url);
    }
    return await app.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<BackfillMessage>, env: Env): Promise<void> {
    await processBackfillBatch(batch.messages, env);
  },

  scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): void {
    ctx.waitUntil(
      (async () => {
        try {
          await hourlySync(env);
          await geocodeMissingLocations(env, 25);
        } catch (error: unknown) {
          console.error("hourly sync failed", error);
        }
      })()
    );
  },
};
