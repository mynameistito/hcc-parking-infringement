import { WorkflowEntrypoint } from "cloudflare:workers";
import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";

import {
  finalizeLiveSeedRefresh,
  planLiveSeedRefresh,
  refreshLiveSeedChunkFromHcc,
  SEED_REFRESH_CHUNK_PREFIX,
} from "@/server/live-seed-refresh.ts";
import type {
  LiveSeedRefreshChunkSummary,
  LiveSeedRefreshPlan,
} from "@/server/live-seed-refresh.ts";

const DEFAULT_WORKFLOW_CHUNK_DAYS = 7;

export interface SeedRefreshWorkflowParams {
  readonly chunkDays?: number;
  readonly reason?: "cron" | "manual";
}

const safeChunkDays = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value) || value < 1) {
    return DEFAULT_WORKFLOW_CHUNK_DAYS;
  }

  return Math.min(Math.floor(value), DEFAULT_WORKFLOW_CHUNK_DAYS);
};

const chunkName = (window: { readonly end: string; readonly start: string }) =>
  `${SEED_REFRESH_CHUNK_PREFIX}${window.start}-${window.end}.ndjson`;

const refreshWindows = async (
  env: Env,
  plan: LiveSeedRefreshPlan,
  step: WorkflowStep,
  index = 0,
  summaries: LiveSeedRefreshChunkSummary[] = []
): Promise<LiveSeedRefreshChunkSummary[]> => {
  const window = plan.windows[index];
  if (window === undefined) {
    return summaries;
  }

  const summary = await step.do(
    `refresh seed ${window.start} to ${window.end}`,
    { retries: { backoff: "linear", delay: "30 seconds", limit: 3 } },
    async () =>
      await refreshLiveSeedChunkFromHcc(env, {
        chunk: chunkName(window),
        prefix: plan.prefix,
        syncedAt: plan.syncedAt,
        to: plan.to,
        window,
      })
  );

  return await refreshWindows(env, plan, step, index + 1, [
    ...summaries,
    summary,
  ]);
};

export class SeedRefreshWorkflow extends WorkflowEntrypoint<
  Env,
  SeedRefreshWorkflowParams
> {
  override async run(
    event: WorkflowEvent<SeedRefreshWorkflowParams>,
    step: WorkflowStep
  ): Promise<unknown> {
    const plan = await step.do(
      "plan seed refresh",
      async () =>
        await planLiveSeedRefresh(
          this.env,
          safeChunkDays(event.payload.chunkDays)
        )
    );
    const summaries = await refreshWindows(this.env, plan, step);

    return await step.do(
      "finalize seed refresh",
      async () =>
        await finalizeLiveSeedRefresh(this.env, {
          existingLive: plan.existingLive,
          existingManifest: plan.existingManifest,
          from: plan.from,
          prefix: plan.prefix,
          summaries,
          syncedAt: plan.syncedAt,
          to: plan.to,
        })
    );
  }
}
