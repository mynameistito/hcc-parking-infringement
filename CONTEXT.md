# HCC Parking Infringement — domain vocabulary

## Public API contracts (`src/contracts/`)

Shared Zod schemas and TypeScript types for HTTP and WebSocket payloads consumed by the dashboard.

| Term                   | Meaning                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `LiveStats`            | Public aggregate counts (today, 7d, 30d, all-time, fines total) |
| `PublicInfringement`   | Infringement row without internal sync metadata                 |
| `TopItem`              | Ranked label + count (streets or offences)                      |
| `FullDashboardMessage` | WebSocket `type: "full"` snapshot pushed after sync             |

## Storage (`ParkingStore` Durable Object)

| Term              | Meaning                                               |
| ----------------- | ----------------------------------------------------- |
| `InfringementRow` | Full SQLite row including `firstSeenAt` / `updatedAt` |
| `PublicLiveStats` | Denormalized `stats_live` row for the dashboard       |
| `Admin LiveStats` | On-demand aggregates with cent totals per period      |

### Module layout (`src/durable-objects/parking-store/`)

| Module                                        | Responsibility                                      |
| --------------------------------------------- | --------------------------------------------------- |
| `durable-object.ts`                           | DO class: WebSocket lifecycle, migration, RPC stubs |
| `store-api.ts`                                | All RPC business logic (single facade)              |
| `live-coordinator.ts`                         | Snapshot refresh + recompute + broadcast            |
| `schema.ts`                                   | SQLite migrations                                   |
| `sync.ts` / `sync-ingest.ts`                  | Ingestion runs, upserts, watermarks                 |
| `stats.ts`                                    | Live aggregates, cache status                       |
| `browse-queries.ts` / `rankings.ts`           | Explore and top-list SQL                            |
| `infringements.ts`                            | List/filter infringements                           |
| `locations.ts` / `geocode-candidates.ts`      | Map routes and geocode queue                        |
| `dashboard-snapshot.ts` / `dashboard-live.ts` | WebSocket snapshot assembly and cache               |
| `watermarks.ts` / `backfill-state.ts`         | Backfill progress and dirty flags                   |
| `websocket.ts`                                | Upgrade handler, ping/pong, push                    |

DO types live under `src/durable-objects/types/` (sync, browse, stats, infringements, locations, dashboard) and re-export from `types.ts`.

## Time boundaries

All calendar windows (today, month, pace trends) use **Pacific/Auckland** via `src/lib/auckland-time.ts`.
