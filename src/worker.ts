import { app } from "@/app.ts";
import type { BackfillMessage, LegacyBackfillMessage } from "@/backfill.ts";
import { ParkingStore } from "@/durable-objects/parking-store.ts";
import { SeedRefreshCoordinator } from "@/durable-objects/seed-refresh-coordinator.ts";
import { createAppScope } from "@/server/app-scope.ts";
import { processBackfillQueueBatch } from "@/server/backfill-queue.ts";
import { runScheduledMaintenance } from "@/server/scheduled-tasks.ts";
import { SeedRefreshWorkflow } from "@/server/seed-refresh-workflow.ts";

export { ParkingStore };
export { SeedRefreshCoordinator };
export { SeedRefreshWorkflow };

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
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): void {
    const scope = createAppScope(env);
    ctx.waitUntil(
      (async () => {
        try {
          await runScheduledMaintenance(scope, controller.scheduledTime);
        } catch (error: unknown) {
          console.error("scheduled maintenance failed", error);
        }
      })()
    );
  },
};
