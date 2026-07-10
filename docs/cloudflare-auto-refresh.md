# Cloudflare auto-refresh architecture

## Failure analysis

Production was healthy but stale: the published seed reported a last sync on 2026-07-01 and a newest HCC record on 2026-06-29. The upstream HCC API still responded successfully but returned no newer records, so `lastRecordAt` can legitimately lag even when refresh is working. `lastSyncedAt` is the freshness signal for our pipeline.

The previous hosted path was:

```text
Cron Trigger -> Worker -> one Workflow -> 58 seven-day HCC/R2 steps -> finalize
```

That does not fit the Workers Free plan. A free Workflow is limited to 10 ms of CPU per step and 50 subrequests per instance. A 400-day refresh needs about 58 HCC reads plus 58 R2 writes before pagination and finalization, so it can exceed both limits. Starting another workflow every six hours can also overlap failed or slow instances.

The former `daily:refresh` command had an independent defect. It started the seed-mode local Worker, which intentionally has no `PARKING_STORE` binding, and then called a Durable Object backfill route. It failed at `getByName` before any seed could be published.

The first live coordinator run also exposed that the legacy R2 S3 credential could read objects but returned `403 Forbidden` on every write. Production now uses the native `PARKING_SEED` Worker binding, so refreshes no longer depend on external S3 credentials or their separate permission scope.

## Target architecture

```text
Cron Trigger (every 6 hours)
  -> Worker scheduled handler
  -> SeedRefreshCoordinator Durable Object (one object for this dataset)
      -> plan and checkpoint in local SQLite
      -> alarm: fetch one seven-day HCC slice
      -> write that slice to R2
      -> checkpoint summary and schedule next alarm
      -> retry a failed slice with bounded backoff
      -> finalize dashboard snapshot and manifest in R2
      -> broadcast the new snapshot to hibernating WebSocket clients

Browser
  -> IndexedDB snapshot immediately
  -> hibernating coordinator WebSocket
  -> fresh R2 snapshot on connect and after every completed refresh
```

Each alarm performs bounded work and has its own Durable Object invocation budget. SQLite preserves progress through eviction or deployment. An active refresh is deduplicated, and constructor/heartbeat repair restores a missing alarm. A failed slice retries six times and exposes its last error through the authenticated status endpoint.

All-time totals advance from a compact `refresh-cursor.json` R2 object containing the exact set of infringement numbers already published by the rolling refresh. HCC uses multiple number sequences, so a single high-water mark is not sufficient. The first coordinator run bootstraps the set from the legacy recent-data object; each slice counts only records absent from that persisted set. Finalization writes the snapshot, manifest, and then the union of the prior and current ID sets. Because every retry recomputes from the plan's original baseline, a repeated finalization writes the same totals, while the next scheduled job adds zero for already-published records.

The WebSocket path remains push-first. It does not add REST polling to the browser. Cloudflare's hibernation API allows idle sockets to remain connected without keeping the object active.

## Free-tier budget

At the configured six-hour cadence, a 400-day refresh is approximately:

- 4 refreshes per day.
- 58 slice alarms plus planning/finalization per refresh.
- About 240 Durable Object invocations per day before client connections.
- About 7,000 R2 writes per month, plus a small number of manifest/snapshot reads and writes.
- A few megabytes of coordinator SQLite state at most; summaries are replaced at the start of the next job.

This is comfortably below the published free allowances of 100,000 Durable Object requests per day, 5 GB aggregate Durable Object storage, 10 GB-month of R2 Standard storage, one million monthly R2 Class A operations, and ten million monthly R2 Class B operations. Treat these as operational guardrails and re-check Cloudflare's current limits before materially increasing cadence, history, or traffic:

- <https://developers.cloudflare.com/durable-objects/platform/pricing/>
- <https://developers.cloudflare.com/durable-objects/platform/limits/>
- <https://developers.cloudflare.com/r2/pricing/>
- <https://developers.cloudflare.com/workers/platform/limits/>

## Operations

Cloudflare starts refreshes automatically from `0 */6 * * *` (UTC). A manual run uses the same path:

```powershell
bun run daily:refresh
```

The command reads `API_KEY` from `.dev.vars`, triggers production, follows checkpoint progress, fails on a terminal coordinator error, and verifies that the published `lastSyncedAt` advanced. Use `--no-wait` to trigger without following it, `--timeout-minutes=30` to change the deadline, or `--live-url=...` to target another deployment.

Authenticated endpoints:

- `POST /api/v1/seed/refresh` starts or deduplicates a refresh.
- `GET /api/v1/seed/refresh/status` reports job ID, status, window progress, retries, timestamps, and the last safe error message.

Public verification endpoints:

- `GET /api/v1/health` confirms the seed deployment and total record count.
- `GET /api/v1/stats/live` exposes `lastSyncedAt` and `lastRecordAt`.
- `GET /api/v1/infringements/recent?limit=3` confirms the newest published rows.

## Rollout and validation

1. Deploy the seed configuration. Migration `v2` creates the SQLite-backed `SeedRefreshCoordinator`; existing R2 seed objects remain the serving source.
2. Confirm `/api/v1/health` still reports `readSource: "seed"`.
3. Trigger `bun run daily:refresh -- --no-wait`.
4. Poll the authenticated status endpoint until `complete`.
5. Confirm `lastSyncedAt` advanced. Do not require `lastRecordAt` to advance when HCC has not published newer rows.
6. Trigger a second run and confirm the all-time total is unchanged when HCC returns no higher infringement numbers.
7. Hold an open dashboard WebSocket during finalization and confirm it receives the new full snapshot without reconnecting.
8. Leave the six-hour Cron Trigger enabled and inspect status after the next scheduled window.

Rollback is code-only: redeploy the previous Worker version. R2 remains intact, and the coordinator uses an isolated Durable Object namespace, so it does not mutate the historical `ParkingStore` object.
