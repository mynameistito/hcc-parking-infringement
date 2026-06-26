/** Run async work over items with a fixed concurrency limit (no await-in-loop). */
export const mapWithConcurrency = async <T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  if (items.length === 0) {
    return [];
  }

  const results = Array.from<R | undefined>({ length: items.length });
  const limit = Math.min(Math.max(1, concurrency), items.length);

  const runAt = async (index: number): Promise<void> => {
    if (index >= items.length) {
      return;
    }

    const item = items[index];
    if (item === undefined) {
      return;
    }

    results[index] = await fn(item, index);
    await runAt(index + limit);
  };

  await Promise.all(
    Array.from({ length: limit }, async (_, startIndex) => {
      await runAt(startIndex);
    })
  );

  return results.map((value, index) => {
    if (value === undefined) {
      throw new Error(`mapWithConcurrency missing result at index ${index}`);
    }
    return value;
  });
};
