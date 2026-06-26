/** Whether ParkingStore reads are served from R2 seed instead of the DO. */

export type ParkingStoreReadSource = "durable_object" | "seed";

const parseParkingStoreReadSource = (
  value: string | undefined
): ParkingStoreReadSource => (value === "seed" ? "seed" : "durable_object");

export const getParkingStoreReadSource = (env: Env): ParkingStoreReadSource =>
  parseParkingStoreReadSource(env.PARKING_STORE_READ_SOURCE);

export const readsParkingStoreFromSeed = (env: Env): boolean =>
  getParkingStoreReadSource(env) === "seed";
