# HCC Parking Infringement Dashboard

A public dashboard for exploring Hamilton City Council parking infringement data. The app syncs HCC open data into a Cloudflare Worker-backed store, serves cached public dashboard APIs, and provides internal tools for backfill, refresh, and geocoding.

## What It Shows

- Live aggregate infringement counts and fine totals.
- Daily and rolling trend charts.
- Top streets, suburbs, offences, and vehicle types.
- Recent infringement rows.
- Map points generated from cached street-level geocoding.

## Data Source

The infringement records come from the [HCC infringement dataset](https://data-waikatolass.opendata.arcgis.com/datasets/hcc::infringement/about) published by Hamilton City Council on Waikato LASS Open Data. This project does not proxy dashboard traffic directly to HCC; data is fetched by scheduled or manual sync jobs, normalized, stored, and served from the app cache.

The underlying data is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) by Hamilton City Council.

Public data remains subject to the original publisher's terms. Verify the HCC open data terms before redistributing exported datasets or derived data bundles.

## Stack

- Cloudflare Workers, Durable Objects, Queues, cron triggers, and static assets.
- React, Vite, TanStack Query, and MapLibre.
- Hono for the Worker API.
- Bun, TypeScript, Vitest, and Ultracite.

## Architecture

```text
HCC Open Data API
    -> Worker sync, backfill, and refresh jobs
    -> ParkingStore Durable Object SQLite storage
    -> public dashboard APIs and WebSocket snapshots
    -> React dashboard
```

The default production deployment reads prebuilt seed snapshots from R2; the Durable Object store is an alternative read mode. R2 object reads use the Workers Cache API with a default 60-second TTL, including binding reads. Successful writes attempt to invalidate the local cached object; a failed invalidation can leave the old entry until its TTL expires. Cache entries in other data centres expire by TTL, so publication is eventually visible across regions. Set `PARKING_SEED_CACHE_SECONDS=0` to bypass object caching. Cache failures fall back to R2. Public responses also advertise a 60-second browser cache, so freshness can lag object publication further. Admin and sync routes are protected by API keys or cron secrets.

The default seed deployment persists logs for 10% of requests and traces for 1%, instead of recording every request. Invocation logs remain enabled for sampled requests. These are cost-control defaults, not guarantees that every error is retained: head sampling can omit failed requests too. Temporarily raise the relevant rate to `1` and redeploy when investigating a reproducible issue, then restore sampling. Monitor account usage rather than assuming that caching or sampling guarantees a zero bill. See Cloudflare's [log sampling](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#head-based-sampling), [trace sampling](https://developers.cloudflare.com/workers/observability/traces/), and [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

The November 2026 Personal account audit reported 416,921,556 bytes across 707 Standard R2 objects account-wide. The current Standard allowance includes 10 GB-month of storage, 1 million Class A operations and 10 million Class B operations monthly. This supports retaining R2 snapshots with caching for the dashboard's read workload; storage volume alone cannot establish total cost. The billing API returned HTTP 403 for the available credentials, so billable request usage and total account spend were not verified. Cron triggers remain deliberately disabled; use the authenticated manual refresh operational client when a new snapshot is needed.

## Cloudflare resource tags

Production resources use Cloudflare's [Resource Tagging API](https://developers.cloudflare.com/resource-tagging/get-started/) with `project=hcc-parking-infringement`, `environment=production`, and a `component` tag:

| Resource                                                  | Component       |
| --------------------------------------------------------- | --------------- |
| `hcc-parking-infringement` Worker                         | `dashboard`     |
| `hcc-parking-infringement-seed` R2 bucket                 | `seed-storage`  |
| `ParkingStore` Durable Object namespace                   | `parking-store` |
| `SeedRefreshCoordinator` Durable Object namespace         | `seed-refresh`  |
| `hcc-backfill` queue                                      | `backfill`      |
| Both `hcc-parking-infringement` custom-domain DNS records | `dashboard-dns` |

These tags were applied and read back through the API. They are managed separately from Wrangler's Worker script tags. When changing tags, GET the current tags, merge the desired keys, then PUT the full tag map to preserve unrelated metadata. Serialize this GET-through-PUT sequence per resource across all writers so concurrent updates cannot overwrite one another. Shared parent DNS zones are not project-specific resources.

## Local Development

Install dependencies:

```powershell
bun install
```

Create local secrets:

```powershell
Copy-Item .dev.vars.example .dev.vars
```

Update `.dev.vars` with local-only values. Do not commit `.dev.vars`.

Run with Wrangler for the closest Cloudflare runtime behavior:

```powershell
bun run dev:wrangler
```

After clearing local Wrangler state, restore the dashboard snapshot from the existing `data/seed` export before starting Vite:

```powershell
bun run seed:local
```

This validates all referenced files before uploading the snapshot, infringement chunks, and optional watermarks to local R2, then publishes the manifest last. It does not write to remote R2. Full exports can take several minutes to load.

`data/seed` is ignored by Git. A fresh checkout needs a complete trusted export from a project maintainer, or Cloudflare login with R2 read access to the project account. To download the existing production export (read-only), run:

```powershell
bunx wrangler login
New-Item -ItemType Directory -Force data/seed | Out-Null
bunx wrangler r2 object get hcc-parking-infringement-seed/parking-store/v1/manifest.json --file data/seed/manifest.json --remote
if ($LASTEXITCODE -ne 0) { throw "Manifest download failed" }
$seedManifest = Get-Content data/seed/manifest.json -Raw | ConvertFrom-Json
$seedFiles = @($seedManifest.infringementChunks) + @("dashboard-snapshot.json")
if ($seedManifest.dashboardSnapshotKey) { $seedFiles += $seedManifest.dashboardSnapshotKey }
if ($seedManifest.watermarksKey) { $seedFiles += $seedManifest.watermarksKey }
foreach ($seedFile in ($seedFiles | Select-Object -Unique)) {
    bunx wrangler r2 object get "hcc-parking-infringement-seed/parking-store/v1/$seedFile" --file "data/seed/$seedFile" --remote
    if ($LASTEXITCODE -ne 0) { throw "Seed download failed: $seedFile" }
}
bun run seed:local
```

Download while seed publication is idle to obtain a consistent export. Keep exports untracked.

Or run the faster Vite development server:

```powershell
bun run dev
```

Useful commands:

```powershell
bun run test
bun run check
bun run build
bun run backfill
bun run sync
bun run geocode
```

## Public API

Unauthenticated routes power the public dashboard:

- `GET /api/health`
- `GET /api/public/cache`
- `GET /api/public/stats/live`
- `GET /api/public/live/ws`
- `GET /api/public/stats/top?groupBy=street|offence&limit=5`
- `GET /api/public/locations/suburbs`
- `GET /api/public/locations/map`

The dashboard also uses read-only `/api/v1/*` routes for live statistics, recent infringements, browsing, and health checks. Mutating `/api/v1/*` administration, backfill, import, sync, and geocoding routes are key-gated.

## Public Repository Checklist

Before making the repository public:

- Keep `.dev.vars`, `.env*`, local data exports, Wrangler output, and `temp/` ignored.
- Rotate any secrets that were ever committed or copied into issue comments, logs, or screenshots.
- Check whether generated data files, spreadsheets, and seed exports are allowed to be redistributed under the source data terms.
- Review `wrangler.jsonc` for account-specific names you are comfortable making public, such as custom domains, bucket names, and account IDs.

At the time this README was updated, `.dev.vars` was ignored and not tracked.

## Disclaimer

This is an independent project and is not affiliated with, endorsed by, sponsored by, or officially associated with Hamilton City Council.

The information displayed is based on publicly available data and is provided for convenience and informational purposes only.

## License

Application code is licensed under the GNU Affero General Public License v3.0 or later. See [`LICENSE`](./LICENSE).

Copyright (C) 2026 mynameistito.

Parking infringement data is provided by Hamilton City Council via the [HCC infringement dataset](https://data-waikatolass.opendata.arcgis.com/datasets/hcc::infringement/about), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
