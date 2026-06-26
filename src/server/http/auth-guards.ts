import { HTTPException } from "hono/http-exception";

import { verifyApiKey, verifyApiKeyOrCronSecret } from "@/server/auth.ts";

export const assertApiKey = (request: Request, env: Env): void => {
  if (!verifyApiKey(request, env)) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
};

export const assertApiKeyOrCronSecret = (request: Request, env: Env): void => {
  if (!verifyApiKeyOrCronSecret(request, env)) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
};
