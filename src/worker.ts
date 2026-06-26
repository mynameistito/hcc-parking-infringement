import { app } from "@/app.ts";
import type { BackfillMessage } from "@/backfill.ts";
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

  async queue(batch: MessageBatch<BackfillMessage>, env: Env): Promise<void> {
    await processBackfillQueueBatch(batch.messages, env);
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
