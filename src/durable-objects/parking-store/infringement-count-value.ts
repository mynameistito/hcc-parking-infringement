/**
 * Parses the cached count stored in sync metadata.
 * @param value - The stored value, or null when no count is cached.
 * @returns A nonnegative count, or null when the stored value is unusable.
 */
export const parseCachedInfringementCount = (
  value: string | null
): number | null => {
  if (value === null) {
    return null;
  }

  // oxlint-disable-next-line unicorn/prefer-number-coercion -- Stored counts historically accept decimal integer prefixes; Number would change that behavior.
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
