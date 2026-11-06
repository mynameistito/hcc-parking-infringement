import { HTTPException } from "hono/http-exception";

import { verifyApiKey, verifyApiKeyOrCronSecret } from "@/server/auth.ts";

/**
 * Require a valid administration credential.
 * @param request - Incoming HTTP request.
 * @param env - Worker runtime bindings.
 */
export const assertApiKey = (request: Request, env: Env): void => {
  if (!verifyApiKey(request, env)) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
};

/**
 * Require a valid administration or scheduled-job credential.
 * @param request - Incoming HTTP request.
 * @param env - Worker runtime bindings.
 */
export const assertApiKeyOrCronSecret = (request: Request, env: Env): void => {
  if (!verifyApiKeyOrCronSecret(request, env)) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
};
