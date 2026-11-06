/** Whether ParkingStore reads are served from R2 seed instead of the DO. */

/** Supported sources for parking store reads. */
export type ParkingStoreReadSource = "durable_object" | "seed";

const parseParkingStoreReadSource = (
  value: string | undefined
): ParkingStoreReadSource => (value === "seed" ? "seed" : "durable_object");

/**
 * Resolves the configured parking read source, defaulting to the Durable Object.
 * @param env - Worker environment configuration.
 * @returns The selected read source.
 */
export const getParkingStoreReadSource = (env: Env): ParkingStoreReadSource =>
  parseParkingStoreReadSource(env.PARKING_STORE_READ_SOURCE);

/**
 * Checks whether parking reads use the R2 seed.
 * @param env - Worker environment configuration.
 * @returns Whether seed reads are enabled.
 */
export const readsParkingStoreFromSeed = (env: Env): boolean =>
  getParkingStoreReadSource(env) === "seed";
