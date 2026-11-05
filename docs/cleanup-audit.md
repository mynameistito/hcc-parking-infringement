# Cleanup evidence

Baseline: main at 829f5bf. The full Vitest suite passed (16 files, 79 tests) and the Vite production build passed before changes.

## Deletion

`src/components/load-in.tsx` (45 lines) defined `LoadIn` but repository-wide searches for `LoadIn` and `load-in` found only its own declaration. The browser entrypoint is `src/client/main.tsx`, and the Worker entrypoint is `src/worker.ts`; the source and script dynamic-import inventory uses literal imports and contains no glob registry that can reach this module. No test references it. It was removed in f21e96a; immediately after removal all 79 tests and the production build passed. `src/lib/motion-ease.ts` was initially retained because `trend-chart.tsx` used it. After the frontend change removed that reveal animation, a fresh search found only the definition. The one-line file was then deleted; the full 82-test suite and build passed after that deletion. The two deleted files total 46 lines.

## Identical implementations

- `isCloseEvent` and `waitForClose` were identical in `scripts/dev-ts.ts`, `scripts/wrangler-dev.ts`, and `scripts/lib/seed/upload.ts`. The shared `scripts/lib/process-close.ts` owns the existing process-close behavior, used by all three callers. Typecheck, 79 tests, and build passed after extraction.
- `ChartEntry` and `isChartEntry` were identical in `donut-chart-inner.tsx` and `ranked-bar-chart-inner.tsx`. The shared `src/lib/chart-entry.ts` keeps the same guard semantics for both chart consumers. Typecheck, 79 tests, and build passed after extraction.

The cleanup commit changes eight files: 40 added and 120 removed lines, including the single 45-line deleted file; this is an 80-line net reduction. Counts include the extracted helpers.

## Retained candidates

Deprecated public contract aliases remain because absence of internal references does not prove absence of external consumers. `EmptyState` remains in use by explore panels. The HCC empty-paging branch remains because the exported response type permits empty arrays even though the HTTP decoder rejects them. Similar chart and refresh logic was retained where observable behavior or lifecycle differed; similarity alone did not establish safe consolidation. Generated Cloudflare binding types, CLI entrypoints and dynamically loaded chart modules were retained as public or runtime entrypoints.

## Search record

- Before the first deletion, `rg -n 'LoadIn|load-in' --glob '!bun.lock' --glob '!node_modules/**' --glob '!dist/**'` returned three lines, all in `src/components/load-in.tsx` (the interface, export, and type annotation). `git ls-files '*load-in*'` returned that one file.
- `rg -n 'import\\(|import\\.meta\\.glob|require\\(' src scripts` found seven literal dynamic imports, all for react-grab or named chart files; no glob registry was found. Tests and build ran immediately after deletion.
- After chart reveal removal, `rg -n 'LOAD_IN_EASE|motion-ease' src scripts` returned only the definition in `src/lib/motion-ease.ts` before deleting it.
- `fetchInfringements` and `fetchAllInWindow` retain distinct page and pagination responsibilities. The seed reader and durable-object reader retain distinct backing stores and cache/lifecycle semantics. The daily trend and pace panels share chart machinery but have different data and presentation policies; none was merged merely for visual similarity.
