import type { Env } from "./src/env.ts";

declare global {
  type CloudflareEnv = Env;
}


