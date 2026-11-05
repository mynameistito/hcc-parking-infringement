import type { spawn } from "node:child_process";
import { once } from "node:events";

const isCloseEvent = (event: unknown): event is [number | null] =>
  Array.isArray(event) && event.length > 0;

/** Wait for a child process and return its exit code, or 1 when unavailable. */
export const waitForClose = async (
  child: ReturnType<typeof spawn>
): Promise<number> => {
  const event: unknown = await once(child, "close");
  if (!isCloseEvent(event)) {
    return 1;
  }

  const [code] = event;
  return typeof code === "number" ? code : 1;
};
