import type { Env } from "../env.ts";

const parseApiKeys = (apiKeyValue: string | undefined): Set<string> => {
  if (apiKeyValue === undefined || apiKeyValue === "") {
    return new Set();
  }

  return new Set(
    apiKeyValue
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean)
  );
};

const extractBearerToken = (
  authorization: string | undefined
): string | null => {
  if (authorization === undefined || authorization === "") {
    return null;
  }

  const match = /^Bearer\s+(?<token>.+)$/iu.exec(authorization);
  return match?.groups?.token?.trim() ?? null;
};

export const verifyApiKey = (request: Request, env: Env): boolean => {
  const validKeys = parseApiKeys(env.API_KEY);
  if (validKeys.size === 0) {
    return false;
  }

  const bearer = extractBearerToken(
    request.headers.get("Authorization") ?? undefined
  );
  if (bearer !== null && validKeys.has(bearer)) {
    return true;
  }

  const headerKey = request.headers.get("X-API-Key")?.trim();
  return (
    headerKey !== undefined && headerKey !== "" && validKeys.has(headerKey)
  );
};

export const verifyCronSecret = (request: Request, env: Env): boolean => {
  const secret = env.CRON_SECRET?.trim();
  if (secret === undefined || secret === "") {
    return false;
  }

  const bearer = extractBearerToken(
    request.headers.get("Authorization") ?? undefined
  );
  if (bearer === secret) {
    return true;
  }

  const headerSecret = request.headers.get("X-Cron-Secret")?.trim();
  return headerSecret === secret;
};

export const verifyApiKeyOrCronSecret = (request: Request, env: Env): boolean =>
  verifyApiKey(request, env) || verifyCronSecret(request, env);
