import { app } from "@/app.ts";
import type { BackfillMessage, LegacyBackfillMessage } from "@/backfill.ts";
import { ParkingStore } from "@/durable-objects/parking-store.ts";
import { processBackfillQueueBatch } from "@/server/backfill-queue.ts";
import { runScheduledMaintenance } from "@/server/scheduled-tasks.ts";

export { ParkingStore };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/v1/")) {
      return await env.ASSETS.fetch(request.url);
    }
    return await app.fetch(request, env, ctx);
  },

  async queue(
    batch: MessageBatch<BackfillMessage | LegacyBackfillMessage>,
    env: Env
  ): Promise<void> {
    try {
      await processBackfillQueueBatch(batch.messages, env);
    } catch (error: unknown) {
      console.error("[backfill] batch handler failed", {
        backlog: batch.metadata.metrics.backlogCount,
        batchSize: batch.messages.length,
        error: error instanceof Error ? error.message : String(error),
        queue: batch.queue,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },

  scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): void {
    ctx.waitUntil(
      (async () => {
        try {
          await runScheduledMaintenance(env);
        } catch (error: unknown) {
          console.error("hourly sync failed", error);
        }
      })()
    );
  },
};
