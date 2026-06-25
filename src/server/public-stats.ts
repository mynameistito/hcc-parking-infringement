import type {
  PublicLiveStats,
  PublicTopItem,
} from "../durable-objects/parking-store.ts";
import { getParkingStore } from "./store.ts";

export type { PublicLiveStats, PublicTopItem };

export const getPublicLiveStats = async (env: Env): Promise<PublicLiveStats> =>
  await getParkingStore(env).getPublicLiveStats();

export const getPublicTopStreets = async (
  env: Env,
  limit = 5
): Promise<PublicTopItem[]> =>
  await getParkingStore(env).getPublicTop("street", limit);

export const getPublicTopOffences = async (
  env: Env,
  limit = 5
): Promise<PublicTopItem[]> =>
  await getParkingStore(env).getPublicTop("offence", limit);
