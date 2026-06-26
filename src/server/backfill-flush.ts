import { getParkingStore } from "@/server/store.ts";

export const flushBackfillDerivedStateSafely = async (
  env: Env
): Promise<{ flushed: boolean }> => {
  try {
    return await getParkingStore(env).flushBackfillDerivedState();
  } catch (error) {
    console.error("[backfill] stats flush failed (will retry on next batch)", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { flushed: false };
  }
};
