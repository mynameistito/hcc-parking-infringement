import { app } from "./app.ts";
import { ParkingStore } from "./durable-objects/parking-store.ts";
import type { BackfillMessage, Env } from "./env.ts";
import { geocodeMissingLocations } from "./server/geocode.ts";
import { hourlySync, processBackfillMessage } from "./server/sync.ts";

export { ParkingStore };

const fetch: ExportedHandler<Env>["fetch"] = (request, env, ctx) => {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return env.ASSETS.fetch(request);
  }
  return app.fetch(request, env, ctx);
};

export default {
  fetch,

  async queue(batch: MessageBatch<BackfillMessage>, env: Env): Promise<void> {
    const processMessageAt = async (index: number): Promise<void> => {
      if (index >= batch.messages.length) {
        return;
      }

      const message = batch.messages[index];
      if (message === undefined) {
        return;
      }

      try {
        const outcome = await processBackfillMessage(env, message.body);

        if (outcome.split) {
          console.log(
            "split backfill window",
            message.body.startDate,
            message.body.endDate
          );
        }

        message.ack();
      } catch (error) {
        console.error("backfill message failed", message.body, error);
        message.retry();
      }

      await processMessageAt(index + 1);
    };

    await processMessageAt(0);
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
