import { readsParkingStoreFromSeed } from "@/server/parking-read-source.ts";

export class ParkingStoreWriteBlockedError extends Error {
  constructor() {
    super(
      "ParkingStore writes are disabled while PARKING_STORE_READ_SOURCE=seed. Set PARKING_STORE_READ_SOURCE=durable_object (or unset) before importing or syncing."
    );
    this.name = "ParkingStoreWriteBlockedError";
  }
}

export const assertParkingStoreWritable = (env: Env): void => {
  if (readsParkingStoreFromSeed(env)) {
    throw new ParkingStoreWriteBlockedError();
  }
};
