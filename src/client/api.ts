import { z } from "zod";

import { infringementListResponseSchema } from "@/contracts/public-api";
import type { InfringementListResponse } from "@/contracts/public-api";
import {
  INFRINGEMENTS_DEFAULT_PAGE_SIZE,
  INFRINGEMENTS_MAX_PAGE_SIZE,
} from "@/lib/dashboard-constants";

const apiErrorSchema = z.object({ error: z.string().min(1) });

const getErrorMessage = (
  message: string | undefined,
  status: number
): string => {
  if (message !== undefined) {
    return message;
  }

  if (status === 404) {
    return "Data feed unavailable. Start the API server to load live dashboard data.";
  }

  return `Data feed unavailable. Request returned ${status}.`;
};

const fetchRecentPage = async (
  url: string
): Promise<InfringementListResponse> => {
  const response = await fetch(url);

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const parsed = apiErrorSchema.safeParse(body);
    throw new Error(
      getErrorMessage(
        parsed.success ? parsed.data.error : undefined,
        response.status
      )
    );
  }

  return infringementListResponseSchema.parse(await response.json());
};

/**
 * Fetch a page of public recent infringements.
 * @param params - Page size and page number.
 * @returns The resulting `Promise<InfringementListResponse>` value.
 */
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

  return await fetchRecentPage(`/api/v1/infringements/recent?${search}`);
};
