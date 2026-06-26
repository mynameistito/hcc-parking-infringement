import { STATS_LIVE_ID } from "./constants.ts";
import { migrateParkingStoreTimestampsToAuckland } from "./migrate-auckland-times.ts";

export interface ParkingStoreMigrationHooks {
  recomputeStats: () => void;
  refreshDashboardSnapshotCache: () => void;
}

export const runParkingStoreMigrations = (
  sql: SqlStorage,
  hooks: ParkingStoreMigrationHooks
): void => {
  sql.exec(`
    CREATE TABLE IF NOT EXISTS _sql_schema_migrations (
      id INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const currentVersion = sql
    .exec<{ version: number }>(
      "SELECT COALESCE(MAX(id), 0) as version FROM _sql_schema_migrations"
    )
    .one().version;

  if (currentVersion < 1) {
    sql.exec(`
      CREATE TABLE IF NOT EXISTS infringements (
        infringement_number INTEGER PRIMARY KEY,
        occurred_at TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        street TEXT NOT NULL,
        suburb TEXT,
        town TEXT,
        post_code TEXT,
        offence_code TEXT,
        offence_description TEXT NOT NULL,
        offence_category TEXT,
        vehicle_make TEXT,
        vehicle_model TEXT,
        is_towed INTEGER NOT NULL DEFAULT 0,
        first_seen_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_infringements_occurred_at ON infringements (occurred_at);
      CREATE INDEX IF NOT EXISTS idx_infringements_street ON infringements (street);
      CREATE INDEX IF NOT EXISTS idx_infringements_offence_description ON infringements (offence_description);

      CREATE TABLE IF NOT EXISTS sync_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_type TEXT NOT NULL,
        window_start TEXT NOT NULL,
        window_end TEXT NOT NULL,
        fetched INTEGER NOT NULL DEFAULT 0,
        inserted INTEGER NOT NULL DEFAULT 0,
        updated INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        error TEXT,
        started_at TEXT NOT NULL,
        finished_at TEXT
      );

      CREATE TABLE IF NOT EXISTS stats_live (
        id INTEGER PRIMARY KEY,
        all_time_total INTEGER NOT NULL DEFAULT 0,
        all_time_amount_cents INTEGER NOT NULL DEFAULT 0,
        today INTEGER NOT NULL DEFAULT 0,
        last_24h INTEGER NOT NULL DEFAULT 0,
        last_7d INTEGER NOT NULL DEFAULT 0,
        last_30d INTEGER NOT NULL DEFAULT 0,
        this_month INTEGER NOT NULL DEFAULT 0,
        this_year INTEGER NOT NULL DEFAULT 0,
        towed_all_time INTEGER NOT NULL DEFAULT 0,
        towed_today INTEGER NOT NULL DEFAULT 0,
        last_synced_at TEXT,
        last_record_at TEXT
      );

      INSERT OR IGNORE INTO stats_live (id) VALUES (1);

      CREATE TABLE IF NOT EXISTS daily_counts (
        date TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        amount_cents INTEGER NOT NULL DEFAULT 0,
        towed_count INTEGER NOT NULL DEFAULT 0
      );

      INSERT INTO _sql_schema_migrations (id) VALUES (1);
    `);
  }

  if (currentVersion < 2) {
    sql.exec(`
      CREATE TABLE IF NOT EXISTS ingest_watermarks (
        window_start TEXT NOT NULL,
        window_end TEXT NOT NULL,
        record_count INTEGER NOT NULL DEFAULT 0,
        ingested_at TEXT NOT NULL,
        PRIMARY KEY (window_start, window_end)
      );

      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      INSERT INTO _sql_schema_migrations (id) VALUES (2);
    `);
  }

  if (currentVersion < 3) {
    sql.exec(`
      ALTER TABLE infringements ADD COLUMN closed_at TEXT;
      ALTER TABLE infringements ADD COLUMN additional_costs_cents INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE infringements ADD COLUMN court_serve_method TEXT;
      ALTER TABLE infringements ADD COLUMN vehicle_colour TEXT;
      ALTER TABLE infringements ADD COLUMN vehicle_type TEXT;
      ALTER TABLE infringements ADD COLUMN infringement_type INTEGER;

      CREATE TABLE IF NOT EXISTS location_cache (
        street TEXT NOT NULL,
        suburb TEXT NOT NULL DEFAULT '',
        town TEXT NOT NULL DEFAULT 'Hamilton',
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        display_name TEXT NOT NULL DEFAULT '',
        geocoded_at TEXT NOT NULL,
        PRIMARY KEY (street, suburb)
      );

      CREATE INDEX IF NOT EXISTS idx_location_cache_coords ON location_cache (lat, lon);

      INSERT INTO _sql_schema_migrations (id) VALUES (3);
    `);
  }

  if (currentVersion < 4) {
    sql.exec(`
      ALTER TABLE location_cache ADD COLUMN geometry_json TEXT;
      INSERT INTO _sql_schema_migrations (id) VALUES (4);
    `);
  }

  if (currentVersion < 5) {
    sql.exec(`
      ALTER TABLE location_cache ADD COLUMN geocode_failed_at TEXT;
      INSERT INTO _sql_schema_migrations (id) VALUES (5);
    `);
  }

  if (currentVersion < 6) {
    sql.exec(`
      CREATE TABLE IF NOT EXISTS dashboard_snapshot_cache (
        id INTEGER PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      INSERT INTO _sql_schema_migrations (id) VALUES (6);
    `);
  }

  if (currentVersion < 7) {
    sql.exec(`
      CREATE INDEX IF NOT EXISTS idx_infringements_location
        ON infringements (street, suburb, town);
      CREATE INDEX IF NOT EXISTS idx_infringements_vehicle
        ON infringements (vehicle_make, vehicle_model);

      INSERT INTO _sql_schema_migrations (id) VALUES (7);
    `);
  }

  if (currentVersion < 8) {
    sql.exec(`
      ALTER TABLE stats_live ADD COLUMN last_365d INTEGER NOT NULL DEFAULT 0;
      INSERT INTO _sql_schema_migrations (id) VALUES (8);
    `);
    hooks.recomputeStats();
    hooks.refreshDashboardSnapshotCache();
  }

  if (currentVersion < 9) {
    const statsRow = sql
      .exec<{ last_365d: number; all_time_total: number }>(
        "SELECT last_365d, all_time_total FROM stats_live WHERE id = ? LIMIT 1",
        STATS_LIVE_ID
      )
      .one();

    if (
      (statsRow?.last_365d ?? 0) === 0 &&
      (statsRow?.all_time_total ?? 0) > 0
    ) {
      hooks.recomputeStats();
      hooks.refreshDashboardSnapshotCache();
    }

    sql.exec(`
      INSERT INTO _sql_schema_migrations (id) VALUES (9);
    `);
  }

  if (currentVersion < 10) {
    migrateParkingStoreTimestampsToAuckland(sql);
    hooks.recomputeStats();
    hooks.refreshDashboardSnapshotCache();
    sql.exec(`
      INSERT INTO _sql_schema_migrations (id) VALUES (10);
    `);
  }
};
