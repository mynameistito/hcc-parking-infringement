import type { ParkingStore } from "@/durable-objects/parking-store.ts";

const STORE_NAME = "hamilton-parking";

/**
 * Resolve the named parking storage Durable Object.
 * @param env - Worker runtime bindings.
 * @returns The resulting `DurableObjectStub<ParkingStore>` value.
 */
export const getParkingStore = (env: Env): DurableObjectStub<ParkingStore> =>
  env.PARKING_STORE.getByName(STORE_NAME, { locationHint: "oc" });
