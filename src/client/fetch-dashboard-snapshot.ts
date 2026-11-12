import { parseFullDashboardMessageJson } from "@/contracts/dashboard-snapshot";
import type { FullDashboardMessage } from "@/contracts/public-api";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";

/**
 * Fetch and validate a stored dashboard snapshot independently of WebSockets.
 * @param url - Snapshot endpoint, relative in the browser or absolute in tests.
 * @param signal - Caller-owned cancellation and timeout signal.
 * @returns A validated snapshot or a transport/protocol failure.
 */
export const fetchDashboardSnapshot = async (
  url: string,
  signal: AbortSignal
): Promise<Result<FullDashboardMessage, "http" | "invalid" | "network">> => {
  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      return err("http");
    }

    const snapshot = parseFullDashboardMessageJson(await response.text());

    return snapshot === null ? err("invalid") : ok(snapshot);
  } catch {
    return err("network");
  }
};
