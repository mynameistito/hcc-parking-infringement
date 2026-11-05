# Refactor verification

Baseline was merged main `829f5bf`: 16 test files and 79 tests passed, as did the production build. The build reported Zod dependency annotation warnings.

## Stack and validation

| Commit | Change | Evidence |
| --- | --- | --- |
| `f21e96a` | Remove unused entrance and consolidate identical helpers | Search and per-batch test/build evidence in `cleanup-audit.md` |
| `ac462de` | Effect HCC pagination and transport | Typecheck, tests, build; pagination failure-order and supplied-transport tests |
| `e6a67b3` | Capture one instant for refresh windows | Fixed-time window test, typecheck, tests and build |
| `c97b120`, `529edd8`, `b771e54`, `1da42c6`, `7fbaa75` | Audit corrections and small dashboard changes | Each isolated commit snapshot passed typecheck, 82 tests and build |
| `7d5c1e2` | Separate pagination service ownership from the HTTP adapter | Typecheck, 82 tests, build and check; check reported the generic FieldLabel warning before the unreachable field was deleted |
| `746cf70`, `68ccf36` | Remove unreachable explore and map groups | Each isolated commit snapshot passed 82 tests and build |
| `71b5608` | Remove unused standalone UI primitives | 82 tests and build in an isolated commit snapshot |
| `b21f7fe` | Remove unused browser API helpers | Typecheck, 82 tests and build in an isolated commit snapshot |
| `2627de0`, `81f504d`, `2f89df4` | Chart chunking and dashboard presentation | Each isolated commit snapshot passed typecheck, 82 tests and build |
| `8214bf5` | Remove unreferenced internal helpers | 82 tests and build in an isolated commit snapshot |
| `ad83d3e` | Remove unused skeletons and constants | 82 tests and build in an isolated commit snapshot |
| `395fd62` | Remove unreferenced full refresh path | 82 tests and build in an isolated commit snapshot |
| `0efc0f0` | Remove unused map dependencies | Typecheck, 82 tests, build and check; isolated snapshot test/build passed |

The graph audit identifies 19 unreachable UI files and records roots, import searches and dynamic-loading limits. Together with the earlier `LoadIn` and `motion-ease` removals, 21 whole files and 4,469 lines were deleted. The client API batch separately removed 166 lines and added two; internal helper, skeleton/constant and full-refresh batches removed another 280 lines. Other refactor commits include both additions and removals; these counts are not the net repository diff.

## Retained and pending

Public HTTP routes and server map contracts remain available to external clients. Deprecated public contract aliases remain because internal search cannot establish their external use. Seed and durable-object readers use different storage and cache lifetimes; chart and refresh paths with differing behavior were not merged. The cleanup and Effect audits contain detailed evidence and additional decisions.

The Effect audit identifies conditional seed-object and scope opportunities rather than claiming a wholesale migration. Browser performance and loaded-state verification are in progress. The production build and automated tests do not themselves establish browser rendering quality or a performance budget.
