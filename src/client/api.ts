import { infringementListResponseSchema } from "@/contracts/public-api";
import type { InfringementListResponse } from "@/contracts/public-api";
import {
  INFRINGEMENTS_DEFAULT_PAGE_SIZE,
  INFRINGEMENTS_MAX_PAGE_SIZE,
} from "@/lib/dashboard-constants";

const getErrorMessage = (body: unknown, status: number): string => {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string" &&
    body.error.length > 0
  ) {
    return body.error;
  }

  if (status === 404) {
    return "Data feed unavailable. Start the API server to load live dashboard data.";
  }

  return `Data feed unavailable. Request returned ${status}.`;
};

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new Error(getErrorMessage(body, response.status));
  }

  return await response.json();
};

export const fetchRecentInfringements = async (
  params: { limit?: number; page?: number } = {}
): Promise<InfringementListResponse> => {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set(
    "limit",
    String(
      Math.min(
        params.limit ?? INFRINGEMENTS_DEFAULT_PAGE_SIZE,
        INFRINGEMENTS_MAX_PAGE_SIZE
      )
    )
  );

  return infringementListResponseSchema.parse(
    await fetchJson(`/api/v1/infringements/recent?${search}`)
  );
};
