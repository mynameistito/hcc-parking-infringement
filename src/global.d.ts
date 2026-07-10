/// <reference types="vite/client" />

import type { BackfillMessage, LegacyBackfillMessage } from "@/backfill.ts";
import type { ParkingStore } from "@/durable-objects/parking-store.ts";
import type { SeedRefreshCoordinator } from "@/durable-objects/seed-refresh-coordinator.ts";
import type { SeedRefreshWorkflowParams } from "@/server/seed-refresh-workflow.ts";

declare module "*.css";

declare global {
  interface Env {
    BACKFILL_QUEUE: Queue<BackfillMessage | LegacyBackfillMessage>;
    PARKING_STORE: DurableObjectNamespace<ParkingStore>;
    SEED_REFRESH_COORDINATOR: DurableObjectNamespace<SeedRefreshCoordinator>;
    SEED_REFRESH_WORKFLOW: Workflow<SeedRefreshWorkflowParams>;
  }
}
