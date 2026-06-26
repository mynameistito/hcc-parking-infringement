import type { ParkingStore } from "@/durable-objects/parking-store.ts";

const STORE_NAME = "hamilton-parking";

export const getParkingStore = (env: Env): DurableObjectStub<ParkingStore> =>
  env.PARKING_STORE.getByName(STORE_NAME, { locationHint: "oc" });
