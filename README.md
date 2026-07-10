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

The production deploy can also read prebuilt seed snapshots from R2 for lower runtime cost. Admin and sync routes are protected by API keys or cron secrets.

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
