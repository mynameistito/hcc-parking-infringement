import type { AppScope } from "@/server/app-scope.ts";

/**
 * Signals a write attempted against the read-only seed deployment.
 */
class ParkingStoreWriteBlockedError extends Error {
  constructor() {
    super(
      "ParkingStore writes are disabled while PARKING_STORE_READ_SOURCE=seed. Set PARKING_STORE_READ_SOURCE=durable_object (or unset) before importing or syncing."
    );
    this.name = "ParkingStoreWriteBlockedError";
  }
}

/**
 * Reject writes when the request uses seed storage.
 * @param scope - Request services and storage mode.
 */
export const assertParkingStoreWritable = (scope: AppScope): void => {
  if (scope.isSeedMode) {
    throw new ParkingStoreWriteBlockedError();
  }
};
