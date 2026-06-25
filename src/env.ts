import type { Fetcher, Queue } from "@cloudflare/workers-types";

import type { ParkingStore } from "./durable-objects/parking-store.ts";

export interface Env {
  PARKING_STORE: DurableObjectNamespace<ParkingStore>;
  ASSETS: Fetcher;
  BACKFILL_QUEUE: Queue<BackfillMessage>;
  API_KEY: string;
  CRON_SECRET?: string;
  HCC_API_BASE: string;
}

export interface BackfillMessage {
  startDate: string;
  endDate: string;
  force?: boolean;
}
