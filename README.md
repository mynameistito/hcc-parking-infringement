# HCC Parking Infringement Live Ticker

Cloudflare Workers app that syncs Hamilton City Council (HCC) open parking infringement data and serves a public live dashboard plus a key-gated REST API.

## Stack

- **Runtime:** Cloudflare Workers (Durable Objects, Queues, cron)
- **Storage:** `ParkingStore` Durable Object with embedded SQLite
- **Frontend:** React 19 + Vite + TanStack Query
- **API:** Hono
- **Tooling:** Bun, TypeScript, Ultracite (Oxlint + Oxfmt)

## Data flow

```
HCC Open Data API  ──►  background sync only (cron / backfill queue)
                              │
                              ▼
                     ParkingStore DO (SQLite)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   Public dashboard     /api/public/*        /api/v1/* (key)
   (never hits HCC)     (stored cache)       (stored cache)
```

- **All API responses** are served from `ParkingStore` — never proxied to HCC.
- **Hourly cron** only re-fetches the **last 7 days** from HCC (catches late entries).
- **Backfill** skips date windows already ingested (use `?force=true` to re-fetch).
- Responses include `X-Data-Source: stored` and `meta.source: "stored"`.
- **Live dashboard** — WebSocket from `ParkingStore` pushes ticker updates when sync writes data; polls every 15–30s as fallback.

## Architecture

```
Worker (Hono API + cron + queue)
    │
    ├──► ParkingStore DO  (id: "hamilton-parking", location: oc)
    │         └── SQLite: infringements, stats_live, daily_counts, sync_runs
    │
    ├──► BACKFILL_QUEUE  (weekly chunks → DO upsert)
    └──► ASSETS          (Vite SPA dashboard)
```

All reads and writes go through a single `ParkingStore` Durable Object — strong consistency for the live ticker and sync counts. The Worker handles external HCC API fetches; the DO owns persistence.

## Prerequisites

- [Bun](https://bun.sh/)
- Cloudflare account

## Setup (production)

### 1. Install

```bash
bun install
```

### 2. Set secrets

```bash
bunx wrangler secret put API_KEY
bunx wrangler secret put CRON_SECRET   # optional
```

- `API_KEY` — required for `/api/v1/*` including **backfill**
- `CRON_SECRET` — optional; also works for `POST /api/v1/sync`
- Multiple keys: comma-separated in one `API_KEY` secret

Generate a key (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Deploy

```bash
bun run deploy
```

The `ParkingStore` SQLite schema is created automatically on first DO invocation.

### 4. Backfill on production

```powershell
$env:API_KEY = "your-production-key"
$env:WORKER_URL = "https://hcc-parking-infringement.<subdomain>.workers.dev"
bun run backfill
```

Or with curl:

```bash
curl -X POST "https://<worker>/api/v1/sync/backfill" \
  -H "Authorization: Bearer $API_KEY"
# or: -H "X-API-Key: $API_KEY"
```

### 4a. Import historical CSV data

To load a historical export into `ParkingStore`:

```powershell
$env:API_KEY = "your-production-key"
$env:WORKER_URL = "https://hcc-parking-infringement.<subdomain>.workers.dev"
bun run import:csv -- --file=C:\Users\mynameistito\Downloads\Infringement.csv
```

By default, `bun run import:csv` reads `data\Infringement.csv` from this
checkout. Put the historical export there for local or production imports, or
pass `--file=...` to use another path.

The importer sends the CSV in batches to `POST /api/v1/import/infringements`.
Rows are cleaned through the same normalizer as HCC API data and upserted into
the Durable Object by infringement number.

### 5. Geocode map pins (production)

After backfill has imported data:

```powershell
curl -X POST "https://<worker>/api/v1/geocode/run?limit=20" `
  -H "Authorization: Bearer $env:API_KEY"
```

See [Map pins & geocoding](#5-map-pins--geocoding) for full details.

## Local development

Full flow: install → `.dev.vars` → run worker → backfill → open dashboard.

### 1. Install

```bash
bun install
```

### 2. Create `.dev.vars`

Copy the example (same directory as `wrangler.jsonc`). **Do not commit `.dev.vars`.**

PowerShell:

```powershell
Copy-Item .dev.vars.example .dev.vars
```

macOS / Linux:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```env
API_KEY=your-long-random-string
CRON_SECRET=optional-second-secret
WORKER_URL=http://localhost:8787
```

| Variable      | Purpose                                                     |
| ------------- | ----------------------------------------------------------- |
| `API_KEY`     | Read by **wrangler dev** — validates `/api/v1/*` requests   |
| `WORKER_URL`  | Used by **`bun run backfill`** / **`bun run sync`** scripts |
| `CRON_SECRET` | Optional alternative auth for `POST /api/v1/sync`           |

Wrangler loads `API_KEY` into the local worker automatically. The backfill script is a separate process, so you still pass `API_KEY` in the shell (use the same value as in `.dev.vars`).

### 3. Start the worker

Terminal 1:

```bash
bun run dev
```

- Dashboard: [http://localhost:8787](http://localhost:8787)
- Health: [http://localhost:8787/api/health](http://localhost:8787/api/health)

### 4. Run backfill locally

Terminal 2 (PowerShell):

```powershell
$env:API_KEY = "your-long-random-string"   # same as .dev.vars
$env:WORKER_URL = "http://localhost:8787"
bun run backfill
```

Expected response:

```json
{ "ok": true, "enqueued": 42, "skipped": 0, "total": 42 }
```

- **`enqueued`** — weekly date windows queued for import from HCC
- **`skipped`** — windows already ingested (safe to re-run)
- The worker processes the queue in the background; watch Terminal 1 for logs

Re-fetch every window (ignore ingest cache):

```powershell
bun run backfill -- --force
```

### 5. Map pins & geocoding

Map pins are **not** instant — streets must be imported first, then geocoded.

```
infringements (street + suburb)
        │
        ▼
Nominatim geocoder (OpenStreetMap)  ──►  location_cache (lat/lon)
        │
        ▼
GET /api/public/locations/map  ──►  amber circles on dashboard map
```

**Prerequisites**

1. Backfill or sync has run — infringement rows exist in `ParkingStore`
2. Worker is running (`bun run dev` locally, or deployed on Cloudflare)

**Automatic geocoding** (no action needed)

| Trigger                                                     | Streets per run |
| ----------------------------------------------------------- | --------------- |
| Hourly cron (after sync)                                    | 5               |
| Opening the dashboard map (`GET /api/public/locations/map`) | 5 (background)  |

**Manual geocoding** (faster — run after backfill has imported some data)

```powershell
$env:API_KEY = "your-long-random-string"
$env:WORKER_URL = "http://localhost:8787"
bun run geocode

# Larger batch (~50 seconds)
bun run geocode -- --limit=50
```

Or with curl:

```powershell
# Geocode up to 20 top streets (Nominatim ~1 req/sec, so ~20s)
curl -X POST "http://localhost:8787/api/v1/geocode/run?limit=20" `
  -H "Authorization: Bearer $env:API_KEY"
```

Production:

```powershell
$env:WORKER_URL = "https://<worker>.workers.dev"
bun run geocode -- --limit=20
```

**Check map / pending status** (no API key):

```powershell
curl http://localhost:8787/api/public/locations/map
```

Example response:

```json
{
  "meta": {
    "source": "stored",
    "mapTiles": "OpenStreetMap",
    "geocoder": "Nominatim (OpenStreetMap)"
  },
  "data": {
    "points": [
      {
        "street": "Horne St",
        "suburb": "Hamilton Central",
        "town": "Hamilton",
        "count": 31,
        "lat": -37.789,
        "lon": 175.283
      }
    ],
    "pendingGeocode": 142
  }
}
```

- **`points`** — streets with cached coordinates (these become map pins)
- **`pendingGeocode`** — streets still waiting to be geocoded

Refresh [http://localhost:8787](http://localhost:8787) after geocoding — amber circles scale with ticket count. Scroll wheel zooms; tiles use **CARTO dark** (OpenStreetMap data).

> Nominatim is rate-limited (~1 request/second). Coordinates are cached in `ParkingStore` so each street is only geocoded once.

### Live updates (no manual refresh)

The dashboard stays current without reloading the page:

| Mechanism                               | What updates                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| **WebSocket** `GET /api/public/live/ws` | **Full dashboard** — ticker, today/7d/30d pills, top streets/offences, suburb ranks, map pins |
| **Polling fallback**                    | All public queries every 15s when WebSocket is disconnected                                   |
| **UI indicator**                        | Green **Live** dot = WebSocket connected; **Polling** = fallback only                         |

Every sync write (backfill, hourly, manual) broadcasts a complete snapshot from `ParkingStore` — you should see streets, suburbs, offences, and map pins update alongside the all-time total without refreshing.

### 6. Optional: manual sync

Recent data only (last 7 days):

```powershell
$env:API_KEY = "your-long-random-string"
$env:WORKER_URL = "http://localhost:8787"
bun run sync
```

### 7. Fast frontend iteration (optional)

```bash
# Terminal 1 — API
bunx wrangler dev

# Terminal 2 — Vite HMR (proxies /api → :8787)
bun run dev:client
# http://localhost:5173
```

## Routes

### Public (no API key)

| Route                                                       | Description                                 |
| ----------------------------------------------------------- | ------------------------------------------- |
| `GET /`                                                     | Live dashboard SPA                          |
| `GET /api/health`                                           | Health check                                |
| `GET /api/public/cache`                                     | Cache status (records, last HCC fetch)      |
| `GET /api/public/stats/live`                                | Aggregate stats for ticker                  |
| `GET /api/public/live/ws`                                   | WebSocket — live stats + map refresh pushes |
| `GET /api/public/locations/streets`                         | Ranked streets                              |
| `GET /api/public/stats/top?groupBy=street\|offence&limit=5` | Top streets/offences                        |
| `GET /api/public/locations/suburbs`                         | Ranked suburbs                              |
| `GET /api/public/locations/map`                             | Map points (OpenStreetMap / CARTO dark)     |

### Gated (`Authorization: Bearer <API_KEY>` or `X-API-Key`)

| Route                                           | Description                                                     |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `GET /api/v1/cache/status`                      | Ingest watermarks + HCC fetch policy                            |
| `GET /api/v1/stats/live`                        | Live stats with amounts                                         |
| `GET /api/v1/stats/daily?from=&to=`             | Daily time series                                               |
| `GET /api/v1/stats/top?groupBy=&window=&limit=` | Top streets/offences                                            |
| `GET /api/v1/infringements`                     | Paginated infringement list                                     |
| `GET /api/v1/health`                            | Sync run status                                                 |
| `POST /api/v1/sync/backfill`                    | Enqueue missing backfill windows (`?force=true` re-fetches all) |
| `POST /api/v1/sync`                             | Manual hourly sync                                              |
| `POST /api/v1/import/infringements`             | Import raw infringement rows into ParkingStore                  |
| `POST /api/v1/geocode/run?limit=10`             | Geocode streets for map                                         |

## Scripts

| Script       | Description                                                           |
| ------------ | --------------------------------------------------------------------- |
| `dev`        | Build client + `wrangler dev`                                         |
| `dev:client` | Vite dev server with API proxy                                        |
| `deploy`     | Build + deploy Worker                                                 |
| `backfill`   | `POST /api/v1/sync/backfill` (needs `API_KEY` + `WORKER_URL`)         |
| `import:csv` | Import historical CSV rows into `ParkingStore`                        |
| `sync`       | `POST /api/v1/sync` (needs `API_KEY` or `CRON_SECRET` + `WORKER_URL`) |
| `geocode`    | `POST /api/v1/geocode/run` (needs `API_KEY` + `WORKER_URL`)           |
| `lint`       | Ultracite check                                                       |
| `format`     | Ultracite fix                                                         |

## Cron

`0 * * * *` — hourly sync of the **last 7 days** only (historical data already in ParkingStore).

## Environment bindings

| Binding          | Type                       | Description                            |
| ---------------- | -------------------------- | -------------------------------------- |
| `PARKING_STORE`  | Durable Object             | `ParkingStore` — all infringement data |
| `BACKFILL_QUEUE` | Queue                      | `hcc-backfill` producer/consumer       |
| `ASSETS`         | Static assets              | Vite-built dashboard                   |
| `HCC_API_BASE`   | var                        | `https://api.hcc.govt.nz/OpenData`     |
| `API_KEY`        | secret / `.dev.vars`       | Gated API access                       |
| `CRON_SECRET`    | secret / `.dev.vars`       | Optional manual sync auth              |
| `WORKER_URL`     | `.dev.vars` (scripts only) | Target for `backfill` / `sync` scripts |
