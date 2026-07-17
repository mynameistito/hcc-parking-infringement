import { DurableObject } from "cloudflare:workers";
import { z } from "zod";

import {
  dailyStatPointSchema,
  publicInfringementSchema,
  publicLiveStatsSchema,
} from "@/contracts/public-api.ts";
import {
  finalizeLiveSeedRefresh,
  planLiveSeedRefresh,
  refreshLiveSeedChunkFromHcc,
  SEED_REFRESH_CHUNK_PREFIX,
} from "@/server/live-seed-refresh.ts";
import type {
  LiveSeedRefreshChunkSummary,
  LiveSeedRefreshPlan,
  RefreshLiveSeedResult,
} from "@/server/live-seed-refresh.ts";
import {
  createParkingStoreReader,
  createSeedReadCache,
} from "@/server/parking-reader/index.ts";
import { seedManifestSchema } from "@/server/seed-manifest.ts";
import type {
  SeedRefreshStatusDto,
  StartSeedRefreshInput,
} from "@/server/seed-refresh-coordinator.ts";

const DEFAULT_WORK_CHUNK_DAYS = 7;
const MAX_ATTEMPTS = 6;
const NEXT_ALARM_DELAY_MS = 1000;
const RETRY_BASE_DELAY_MS = 30_000;

const countEntrySchema = z.tuple([z.string(), z.number()]);
const refreshWindowSchema = z.object({
  end: z.string(),
  start: z.string(),
});
const refreshPlanSchema = z.object({
  bootstrapAfter: z.string().nullable(),
  existingLive: publicLiveStatsSchema.nullable(),
  existingManifest: seedManifestSchema.nullable(),
  from: z.string(),
  prefix: z.string(),
  publishedInfringementNumbers: z.array(z.number()),
  syncedAt: z.string(),
  to: z.string(),
  windows: z.array(refreshWindowSchema),
});
const refreshSummarySchema = z.object({
  amountCents: z.number(),
  chartOffenceCategories: z.array(countEntrySchema),
  chartOffences: z.array(countEntrySchema),
  chartStreets: z.array(countEntrySchema),
  chartSuburbs: z.array(countEntrySchema),
  chartTowed: z.array(countEntrySchema),
  chartVehicleMakes: z.array(countEntrySchema),
  chartVehicleTypes: z.array(countEntrySchema),
  chunk: z.string(),
  dailyTrend: z.array(dailyStatPointSchema),
  infringementNumbers: z.array(z.number()),
  last24h: z.number(),
  last30d: z.number(),
  last365d: z.number(),
  last7d: z.number(),
  lastRecordAt: z.string().nullable(),
  newAmountCents: z.number(),
  newRecords: z.number(),
  recentInfringements: z.array(publicInfringementSchema),
  records: z.number(),
  skipped: z.number(),
  streetCounts: z.array(countEntrySchema),
  suburbCounts: z.array(countEntrySchema),
  thisMonth: z.number(),
  today: z.number(),
  topOffences: z.array(countEntrySchema),
  towedToday: z.number(),
  vehicles: z.array(countEntrySchema),
});
const refreshResultSchema = z.object({
  from: z.string(),
  skipped: z.number(),
  to: z.string(),
  totalRecentRecords: z.number(),
});

interface RefreshStateRow extends Record<string, SqlStorageValue> {
  readonly attempts: number;
  readonly finished_at: string | null;
  readonly job_id: string;
  readonly last_error: string | null;
  readonly next_index: number;
  readonly plan_json: string | null;
  readonly reason: "cron" | "manual";
  readonly result_json: string | null;
  readonly started_at: string;
  readonly status: "planning" | "running" | "complete" | "errored";
}

interface SummaryRow extends Record<string, SqlStorageValue> {
  readonly summary_json: string;
}

const nowIso = (): string => new Date().toISOString();

const workflowInstanceId = (input: StartSeedRefreshInput): string => {
  if (input.reason === "manual" || input.scheduledTime === undefined) {
    return `seed-refresh-manual-${Date.now()}`;
  }

  const date = new Date(input.scheduledTime);
  const hour = Math.floor(date.getUTCHours() / 6) * 6;
  const day = date.toISOString().slice(0, 10);
  return `seed-refresh-${day}-${String(hour).padStart(2, "0")}`;
};

const chunkName = (window: {
  readonly end: string;
  readonly start: string;
}): string =>
  `${SEED_REFRESH_CHUNK_PREFIX}${window.start}-${window.end}.ndjson`;

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Coordinates free-tier-safe seed refresh slices and hibernating live sockets. */
export class SeedRefreshCoordinator extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(async () => {
      this.migrate();
      await this.repairAlarm();
    });
  }

  private migrate(): void {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS refresh_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        job_id TEXT NOT NULL,
        status TEXT NOT NULL,
        reason TEXT NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        plan_json TEXT,
        next_index INTEGER NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        result_json TEXT
      );
      CREATE TABLE IF NOT EXISTS refresh_summaries (
        window_index INTEGER PRIMARY KEY,
        summary_json TEXT NOT NULL
      );
    `);
  }

  private readState(): RefreshStateRow | null {
    return (
      this.ctx.storage.sql
        .exec<RefreshStateRow>("SELECT * FROM refresh_state WHERE id = 1")
        .toArray()[0] ?? null
    );
  }

  private static statusFromState(
    state: RefreshStateRow | null
  ): SeedRefreshStatusDto {
    if (state === null) {
      return {
        attempts: 0,
        completedWindows: 0,
        finishedAt: null,
        id: null,
        lastError: null,
        reason: null,
        startedAt: null,
        status: "idle",
        totalWindows: 0,
      };
    }

    const plan =
      state.plan_json === null
        ? null
        : refreshPlanSchema.parse(JSON.parse(state.plan_json));
    return {
      attempts: state.attempts,
      completedWindows: state.next_index,
      finishedAt: state.finished_at,
      id: state.job_id,
      lastError: state.last_error,
      reason: state.reason,
      startedAt: state.started_at,
      status: state.status,
      totalWindows: plan?.windows.length ?? 0,
    };
  }

  private async repairAlarm(): Promise<void> {
    const state = this.readState();
    if (
      (state?.status === "planning" || state?.status === "running") &&
      (await this.ctx.storage.getAlarm()) === null
    ) {
      await this.ctx.storage.setAlarm(Date.now() + NEXT_ALARM_DELAY_MS);
    }
  }

  private readSummaries(): LiveSeedRefreshChunkSummary[] {
    return this.ctx.storage.sql
      .exec<SummaryRow>(
        "SELECT summary_json FROM refresh_summaries ORDER BY window_index"
      )
      .toArray()
      .map((row) => refreshSummarySchema.parse(JSON.parse(row.summary_json)));
  }

  private readPublishedInfringementNumbers(
    plan: LiveSeedRefreshPlan,
    beforeWindowIndex: number
  ): number[] {
    const published = new Set(plan.publishedInfringementNumbers);
    const summaries = this.ctx.storage.sql
      .exec<SummaryRow>(
        `SELECT summary_json
         FROM refresh_summaries
         WHERE window_index < ?
         ORDER BY window_index`,
        beforeWindowIndex
      )
      .toArray();

    for (const row of summaries) {
      const summary = refreshSummarySchema.parse(JSON.parse(row.summary_json));
      for (const infringementNumber of summary.infringementNumbers) {
        published.add(infringementNumber);
      }
    }

    return [...published];
  }

  private async broadcastCurrentSnapshot(): Promise<void> {
    const parking = createParkingStoreReader(this.env, createSeedReadCache());
    const payload = await parking.readDashboardSnapshotPayload();
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(payload);
      } catch {
        // The hibernation API removes disconnected sockets asynchronously.
      }
    }
  }

  private async complete(plan: LiveSeedRefreshPlan): Promise<void> {
    const result = await finalizeLiveSeedRefresh(this.env, {
      existingLive: plan.existingLive,
      existingManifest: plan.existingManifest,
      from: plan.from,
      prefix: plan.prefix,
      publishedInfringementNumbers: plan.publishedInfringementNumbers,
      summaries: this.readSummaries(),
      syncedAt: plan.syncedAt,
      to: plan.to,
    });
    const validatedResult: RefreshLiveSeedResult =
      refreshResultSchema.parse(result);
    this.ctx.storage.sql.exec(
      `UPDATE refresh_state
       SET status = 'complete', finished_at = ?, attempts = 0,
           last_error = NULL, result_json = ?
       WHERE id = 1`,
      nowIso(),
      JSON.stringify(validatedResult)
    );
    try {
      await this.broadcastCurrentSnapshot();
    } catch (error: unknown) {
      console.warn("[seed-refresh] snapshot broadcast failed", {
        error: errorMessage(error),
        jobId: this.readState()?.job_id ?? null,
      });
    }
  }

  private async finishPlanning(): Promise<SeedRefreshStatusDto> {
    const state = this.readState();
    if (state === null || state.status !== "planning") {
      return SeedRefreshCoordinator.statusFromState(state);
    }

    const plan = await planLiveSeedRefresh(this.env, DEFAULT_WORK_CHUNK_DAYS);
    const validatedPlan: LiveSeedRefreshPlan = refreshPlanSchema.parse(plan);
    this.ctx.storage.sql.exec(
      `UPDATE refresh_state
       SET status = 'running', plan_json = ?, attempts = 0, last_error = NULL
       WHERE id = 1 AND status = 'planning' AND job_id = ?`,
      JSON.stringify(validatedPlan),
      state.job_id
    );
    await this.ctx.storage.setAlarm(Date.now() + NEXT_ALARM_DELAY_MS);
    return SeedRefreshCoordinator.statusFromState(this.readState());
  }

  private async processNextSlice(): Promise<void> {
    const state = this.readState();
    if (
      state === null ||
      state.status !== "running" ||
      state.plan_json === null
    ) {
      return;
    }

    const plan = refreshPlanSchema.parse(JSON.parse(state.plan_json));
    const window = plan.windows[state.next_index];
    if (window === undefined) {
      await this.complete(plan);
      return;
    }

    const summary = await refreshLiveSeedChunkFromHcc(this.env, {
      bootstrapAfter: plan.bootstrapAfter,
      chunk: chunkName(window),
      prefix: plan.prefix,
      publishedInfringementNumbers: this.readPublishedInfringementNumbers(
        plan,
        state.next_index
      ),
      syncedAt: plan.syncedAt,
      to: plan.to,
      window,
    });
    const validatedSummary: LiveSeedRefreshChunkSummary =
      refreshSummarySchema.parse(summary);
    this.ctx.storage.sql.exec(
      `INSERT INTO refresh_summaries (window_index, summary_json)
       VALUES (?, ?)
       ON CONFLICT(window_index) DO UPDATE SET summary_json = excluded.summary_json`,
      state.next_index,
      JSON.stringify(validatedSummary)
    );
    this.ctx.storage.sql.exec(
      `UPDATE refresh_state
       SET next_index = ?, attempts = 0, last_error = NULL
       WHERE id = 1`,
      state.next_index + 1
    );
    await this.ctx.storage.setAlarm(Date.now() + NEXT_ALARM_DELAY_MS);
  }

  private async recordFailure(error: unknown): Promise<void> {
    const state = this.readState();
    if (state === null) {
      return;
    }

    const attempts = state.attempts + 1;
    const message = errorMessage(error);
    if (attempts >= MAX_ATTEMPTS) {
      this.ctx.storage.sql.exec(
        `UPDATE refresh_state
         SET status = 'errored', attempts = ?, last_error = ?, finished_at = ?
         WHERE id = 1`,
        attempts,
        message,
        nowIso()
      );
      console.error("[seed-refresh] coordinator exhausted retries", {
        attempts,
        error: message,
        jobId: state.job_id,
        windowIndex: state.next_index,
      });
      return;
    }

    this.ctx.storage.sql.exec(
      "UPDATE refresh_state SET attempts = ?, last_error = ? WHERE id = 1",
      attempts,
      message
    );
    await this.ctx.storage.setAlarm(
      Date.now() + RETRY_BASE_DELAY_MS * attempts
    );
    console.warn("[seed-refresh] coordinator scheduled retry", {
      attempts,
      error: message,
      jobId: state.job_id,
      windowIndex: state.next_index,
    });
  }

  /** Start a refresh, or return the currently active refresh without overlap. */
  async startRefresh(
    input: StartSeedRefreshInput
  ): Promise<SeedRefreshStatusDto> {
    const current = this.readState();
    if (current?.status === "running") {
      await this.repairAlarm();
      return SeedRefreshCoordinator.statusFromState(current);
    }
    if (current?.status === "planning") {
      await this.repairAlarm();
      return await this.finishPlanning();
    }

    const jobId = workflowInstanceId(input);
    const startedAt = nowIso();
    this.ctx.storage.sql.exec("DELETE FROM refresh_summaries");
    this.ctx.storage.sql.exec(
      `INSERT INTO refresh_state (
         id, job_id, status, reason, started_at, finished_at, plan_json,
         next_index, attempts, last_error, result_json
       ) VALUES (1, ?, 'planning', ?, ?, NULL, NULL, 0, 0, NULL, NULL)
       ON CONFLICT(id) DO UPDATE SET
         job_id = excluded.job_id,
         status = excluded.status,
         reason = excluded.reason,
         started_at = excluded.started_at,
         finished_at = NULL,
         plan_json = NULL,
         next_index = 0,
         attempts = 0,
         last_error = NULL,
         result_json = NULL`,
      jobId,
      input.reason,
      startedAt
    );

    try {
      return await this.finishPlanning();
    } catch (error: unknown) {
      this.ctx.storage.sql.exec(
        `UPDATE refresh_state
         SET status = 'errored', last_error = ?, finished_at = ?
         WHERE id = 1`,
        errorMessage(error),
        nowIso()
      );
      throw error;
    }
  }

  /** Return status and repair a missing alarm for an active refresh. */
  async getStatus(): Promise<SeedRefreshStatusDto> {
    await this.repairAlarm();
    return SeedRefreshCoordinator.statusFromState(this.readState());
  }

  /** Low-frequency repair hook for the coordinator's only durable job. */
  async heartbeat(): Promise<SeedRefreshStatusDto> {
    return await this.getStatus();
  }

  /** Process one bounded HCC/R2 slice per alarm invocation. */
  async alarm(): Promise<void> {
    try {
      if (this.readState()?.status === "planning") {
        await this.finishPlanning();
        return;
      }
      await this.processNextSlice();
    } catch (error: unknown) {
      await this.recordFailure(error);
    }
  }

  /** Upgrade seed-mode dashboard clients onto hibernating WebSockets. */
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const parking = createParkingStoreReader(this.env, createSeedReadCache());
    const payload = await parking.readDashboardSnapshotPayload();
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    try {
      server.send(payload);
    } catch {
      // The client can disconnect while the initial snapshot is loading.
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  /** Respond to client keepalives without waking a standard Worker socket. */
  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
    if (!this.ctx.getWebSockets().includes(socket)) {
      return;
    }

    const text =
      typeof message === "string" ? message : new TextDecoder().decode(message);
    if (text === "ping") {
      socket.send(JSON.stringify({ at: nowIso(), type: "pong" }));
    }
  }
}
