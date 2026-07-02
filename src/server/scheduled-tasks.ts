import type { AppScope } from "@/server/app-scope.ts";
import { geocodeMissingLocations } from "@/server/geocode.ts";
import { hourlySync } from "@/server/sync.ts";

const SEED_REFRESH_WORKFLOW_RETENTION = "3 days";

const workflowInstanceId = (scheduledTime?: number): string => {
  if (scheduledTime === undefined) {
    return `seed-refresh-manual-${Date.now()}`;
  }

  const date = new Date(scheduledTime ?? Date.now());
  const hour = Math.floor(date.getUTCHours() / 6) * 6;
  const day = date.toISOString().slice(0, 10);
  return `seed-refresh-${day}-${String(hour).padStart(2, "0")}`;
};

export const startSeedRefreshWorkflow = async (
  env: Env,
  options: {
    readonly reason: "cron" | "manual";
    readonly scheduledTime?: number;
  }
): Promise<{ id: string }> => {
  const id = workflowInstanceId(options.scheduledTime);
  const instance = await env.SEED_REFRESH_WORKFLOW.create({
    id,
    params: { reason: options.reason },
    retention: {
      errorRetention: SEED_REFRESH_WORKFLOW_RETENTION,
      successRetention: SEED_REFRESH_WORKFLOW_RETENTION,
    },
  });

  return { id: instance.id };
};

export const runScheduledMaintenance = async (
  scope: AppScope,
  scheduledTime?: number
): Promise<void> => {
  if (scope.isSeedMode) {
    const result = await startSeedRefreshWorkflow(scope.env, {
      reason: "cron",
      scheduledTime,
    });
    console.log("[seed-refresh] workflow started", result);
    return;
  }

  await hourlySync(scope);
  await geocodeMissingLocations(scope, 25);
};
