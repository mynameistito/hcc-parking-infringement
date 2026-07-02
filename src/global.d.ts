/// <reference types="vite/client" />

import type { SeedRefreshWorkflowParams } from "@/server/seed-refresh-workflow.ts";

declare module "*.css";

declare global {
  interface Env {
    SEED_REFRESH_WORKFLOW: Workflow<SeedRefreshWorkflowParams>;
  }
}
