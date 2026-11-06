import type { spawn } from "node:child_process";
import { once } from "node:events";

import { z } from "zod";

const isCloseEvent = (event: unknown): event is [number | null] =>
  Array.isArray(event) && event.length > 0;

/**
 *  Wait for a child process and return its exit code, or 1 when unavailable.
 * @param child - Child supplied to this operation.
 * @returns The resulting `Promise<number>` value.
 */
export const waitForClose = async (
  child: ReturnType<typeof spawn>
): Promise<number> => {
  const event: unknown = await once(child, "close");

  if (!isCloseEvent(event)) {
    return 1;
  }

  const [code] = event;

  const parsed = z.number().safeParse(code);

  return parsed.success ? parsed.data : 1;
};
