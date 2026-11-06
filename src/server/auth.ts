const parseApiKeys = (apiKeyValue: string | undefined): Set<string> => {
  if (apiKeyValue === undefined || apiKeyValue === "") {
    return new Set();
  }

  return new Set(
    apiKeyValue.split(",").flatMap((key) => {
      const trimmed = key.trim();

      return trimmed.length > 0 ? [trimmed] : [];
    })
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

/**
 * Checks a request bearer token or API key header against configured keys.
 * @param request - Incoming request to authorize.
 * @param env - Worker environment containing the configured keys.
 * @returns Whether a configured API key matches.
 */
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

/**
 * Checks a request bearer token or cron header against the configured secret.
 * @param request - Incoming request to authorize.
 * @param env - Worker environment containing the cron secret.
 * @returns Whether the configured secret matches.
 */
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

/**
 * Authorizes a request using either an API key or the cron secret.
 * @param request - Incoming request to authorize.
 * @param env - Worker environment containing the credentials.
 * @returns Whether either credential matches.
 */
export const verifyApiKeyOrCronSecret = (request: Request, env: Env): boolean =>
  verifyApiKey(request, env) || verifyCronSecret(request, env);
