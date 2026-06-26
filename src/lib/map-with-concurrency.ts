const runWithConcurrency = async <T>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> => {
  if (items.length === 0) {
    return;
  }

  const limit = Math.min(Math.max(1, concurrency), items.length);

  const runAt = async (index: number): Promise<void> => {
    if (index >= items.length) {
      return;
    }

    const item = items[index];
    if (item === undefined) {
      return;
    }

    await fn(item, index);
    await runAt(index + limit);
  };

  await Promise.all(
    Array.from({ length: limit }, async (_, startIndex) => {
      await runAt(startIndex);
    })
  );
};

/** Run async side-effect work over items with a fixed concurrency limit. */
export const forEachWithConcurrency = async <T>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> => {
  await runWithConcurrency(items, concurrency, fn);
};

/** Run async work over items with a fixed concurrency limit (no await-in-loop). */
export const mapWithConcurrency = async <T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  if (items.length === 0) {
    return [];
  }

  const results = Array.from<R>({ length: items.length });

  await runWithConcurrency(items, concurrency, async (item, index) => {
    results[index] = await fn(item, index);
  });

  return results;
};
