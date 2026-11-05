# Dead-code reachability audit

Snapshot: 6 November 2026. A static graph of 222 TypeScript/TSX files under `src` and `scripts` used 39 roots: Worker and client entrypoints, every top-level script (including standalone audit scripts), tests and declaration files. It followed literal static imports, re-exports, type imports and dynamic imports with `@/`, `@scripts/` and relative resolution. This conservative graph reached 203 files and left the 19 below unreachable. Tests were roots, so none of these files had an existing test consumer. The graph is a snapshot: re-run searches before further changes.

## Unreachable files

- Explore: `src/components/explore-panel.tsx`, `explore-shared.tsx`, `explore-utils.ts`, `explore-constants.ts`, `shared/ranked-list-row.tsx`, `ui/input.tsx`, `ui/select.tsx`.
- Map: `src/components/location-map.tsx`, `map-heat.ts`, `map-routes.ts`, `ui/field.tsx`, `ui/map.tsx`, `ui/map-geo.ts`, `ui/map-internals.ts`, `ui/map-types.ts`, `ui/native-select.tsx`.
- Standalone UI: `src/components/ui/dialog.tsx`, `scroll-area.tsx`, `separator.tsx`.

The explore panel, explore shared helpers, explore utilities, and location map each had zero incoming source references. Their listed dependencies had incoming references only from within the unreachable groups. Standalone UI files had zero incoming references. The current dashboard imports neither the map nor explore roots. Searches for `import.meta.glob` and `require(` found none in the source, scripts or build/test configuration; literal dynamic imports were the chart components and `react-grab`, all retained. The graph does not prove intent; it establishes that the listed files do not participate in the identified entrypoints.

## Client API exports

Repository searches across `src` and `scripts` found exactly one match apiece, their declarations, for `fetchLiveStats`, `fetchTopStats`, `fetchTopStreets`, `fetchTopSuburbs`, `fetchMapPoints`, `fetchTopVehicles`, `fetchBrowseSuburbs`, `fetchBrowseStreets`, `fetchBrowseVehicles`, `fetchStreetsInSuburb`, and `fetchExploreInfringements`. No tests or string-based imports were found. `fetchRecentInfringements` has a declaration, import and call in `latest-instances.tsx` and is retained. The package is private and has no `main` or `exports` entry. This concerns client helpers only: public HTTP routes, server map contracts and storage data must remain because external clients may consume them.

`maplibre-gl` has references in the unreachable map components and a Vite chunk rule; dependency/configuration removal requires a separate check and is outside these batches. Tests and production build should run after each deletion batch; see current command output for results rather than assuming this snapshot reflects later changes.

## Reproducing and validation

The graph was an ephemeral Node script over `rg --files src scripts` filtered by `/\.(ts|tsx)$/`. It used a regular expression to collect quoted static `import`/`export ... from` and literal `import(...)` specifiers, resolving `@/` to `src/`, `@scripts/` to `scripts/`, and `.` relative to the importing file; it tried the literal path, `.ts`, `.tsx`, `/index.ts`, and `/index.tsx`. A depth-first walk started at `src/worker.ts`, `src/client/main.tsx`, every top-level `scripts/*.ts`, all `*.test.ts[x]` files and declarations. This is a text scan rather than a TypeScript AST or a proof against arbitrary runtime-computed paths. Configuration and framework registrations were checked separately with the searches below; no script file was retained.

```powershell
rg --files src scripts
rg -n 'import\.meta\.glob|import\(|require\(' src scripts vite.config.ts vitest.config.ts
rg -n 'explore-(panel|shared|utils|constants)|shared/ranked-list-row|ui/(input|select)' src scripts index.html vite.config.ts vitest.config.ts
rg -n 'components/(location-map|map-heat|map-routes)|components/ui/(field|map|map-geo|map-internals|map-types|native-select)' src scripts index.html vite.config.ts vitest.config.ts
rg -n 'LocationMap|heatColor|MapGeoJSON|useMap|NativeSelect' src scripts -g '*.test.ts' -g '*.test.tsx'
rg -n 'fetch(LiveStats|TopStats|TopStreets|TopSuburbs|MapPoints|TopVehicles|RecentInfringements|BrowseSuburbs|BrowseStreets|BrowseVehicles|StreetsInSuburb|ExploreInfringements)' src scripts
```

Before map deletion, the import search returned 10 lines, all inside the map group; the test-symbol search returned zero. After each of the explore and map deletion batches, `bun run test` passed 16 files and 82 tests and `bun run build` passed. The build emitted existing Zod/Rolldown annotation warnings. The graph counts are from before either batch and include concurrent checkout changes at that snapshot.
