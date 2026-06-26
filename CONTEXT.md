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

## Time boundaries

All calendar windows (today, month, pace trends) use **Pacific/Auckland** via `src/lib/auckland-time.ts`.
