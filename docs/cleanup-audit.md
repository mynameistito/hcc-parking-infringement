# Cleanup evidence

Baseline: main at 829f5bf. The full Vitest suite passed (16 files, 79 tests) and the Vite production build passed before changes.

## Deletion

`src/components/load-in.tsx` (45 lines) defined `LoadIn` but repository-wide searches for `LoadIn` and `load-in` found only its own declaration. The browser entrypoint is `src/client/main.tsx`, and the Worker entrypoint is `src/worker.ts`; the source and script dynamic-import inventory uses literal imports and contains no glob registry that can reach this module. No test references it. It was removed in f21e96a; immediately after removal all 79 tests and the production build passed. `src/lib/motion-ease.ts` was retained because `trend-chart.tsx` uses it.

## Identical implementations

- `isCloseEvent` and `waitForClose` were identical in `scripts/dev-ts.ts`, `scripts/wrangler-dev.ts`, and `scripts/lib/seed/upload.ts`. The shared `scripts/lib/process-close.ts` owns the existing process-close behavior, used by all three callers. Typecheck, 79 tests, and build passed after extraction.
- `ChartEntry` and `isChartEntry` were identical in `donut-chart-inner.tsx` and `ranked-bar-chart-inner.tsx`. The shared `src/lib/chart-entry.ts` keeps the same guard semantics for both chart consumers. Typecheck, 79 tests, and build passed after extraction.

The cleanup commit changes eight files: 40 added and 120 removed lines, including the single 45-line deleted file; this is an 80-line net reduction. Counts include the extracted helpers.

## Retained candidates

Deprecated public contract aliases remain because absence of internal references does not prove absence of external consumers. `EmptyState` remains in use by explore panels. The HCC empty-paging branch remains because the exported response type permits empty arrays even though the HTTP decoder rejects them. Similar chart and refresh logic was retained where observable behavior or lifecycle differed; similarity alone did not establish safe consolidation. Generated Cloudflare binding types, CLI entrypoints and dynamically loaded chart modules were retained as public or runtime entrypoints.
