import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  Clock3,
  Database,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";

import { DailyTrendPanel } from "@/components/daily-trend-panel";
import { DistributionCharts } from "@/components/distribution-charts";
import { LatestInstances } from "@/components/latest-instances";
import { LiveTicker } from "@/components/live-ticker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ChartBreakdowns,
  DailyStatPoint,
  PublicLiveStats,
  PublicInfringement,
  TopItem,
} from "@/contracts/public-api";
import { EMPTY_CHART_BREAKDOWNS } from "@/contracts/public-api";
import { parseAucklandInstant } from "@/lib/auckland-time";
import type { PaceTrends } from "@/lib/trend-window";

/**
 * Live transport availability and cached fallback state.
 */
export type DashboardConnectionStatus = "live" | "cached" | "connecting";

/**
 * Dashboard data readiness and refresh state.
 */
export type DashboardDataStatus = "loading" | "ready" | "updating";

interface DashboardProps {
  live: PublicLiveStats;
  dailyTrend: DailyStatPoint[];
  paceTrends?: PaceTrends;
  chartBreakdowns?: ChartBreakdowns;
  streets: TopItem[];
  recentInfringements: PublicInfringement[];
  recentInfringementsTotal?: number;
  connectionStatus?: DashboardConnectionStatus;
  dataStatus?: DashboardDataStatus;
  error?: string | null;
}

const LastUpdated = ({
  lastSyncedAt,
  dataStatus,
}: {
  lastSyncedAt: string | null;
  dataStatus?: DashboardDataStatus;
}) => {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      tick((n) => n + 1);
    }, 30_000);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  if (dataStatus === "loading") {
    return (
      <Skeleton className="h-5 w-44" aria-label="Loading last updated time" />
    );
  }

  if (lastSyncedAt === null || lastSyncedAt.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Waiting for first sync...</p>
    );
  }

  let syncedAt: Date;

  try {
    syncedAt = parseAucklandInstant(lastSyncedAt);
  } catch {
    return (
      <p className="text-muted-foreground text-sm">Waiting for first sync...</p>
    );
  }

  const ago = formatDistanceToNow(syncedAt, { addSuffix: true });

  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
      <Clock3 className="text-muted-foreground size-4" aria-hidden="true" />
      Last updated <span className="text-primary font-medium">{ago}</span>
    </p>
  );
};

type ThemeMode = "dark" | "light";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.localStorage.getItem("hcc-theme") === "light"
    ? "light"
    : "dark";
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    window.localStorage.setItem("hcc-theme", theme);
  }, [theme]);

  const isLight = theme === "light";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        setTheme(isLight ? "dark" : "light");
      }}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      {isLight ? (
        <Moon data-icon="inline-start" aria-hidden="true" />
      ) : (
        <Sun data-icon="inline-start" aria-hidden="true" />
      )}
      {isLight ? "Dark" : "Light"}
    </Button>
  );
};

const LiveStatusBadge = ({
  connectionStatus = "connecting",
}: {
  connectionStatus?: DashboardConnectionStatus;
}) => {
  if (connectionStatus === "live") {
    return (
      <Badge variant="success">
        <Activity className="size-3" aria-hidden="true" />
        Live
      </Badge>
    );
  }

  if (connectionStatus === "cached") {
    return (
      <Badge variant="status">
        <Database className="size-3" aria-hidden="true" />
        Cached
      </Badge>
    );
  }

  return (
    <Badge variant="status">
      <Database className="size-3" aria-hidden="true" />
      Connecting
    </Badge>
  );
};

/**
 * Display live infringement totals, trends, distributions, and recent activity.
 * @returns The rendered interface for the supplied data.
 */
export const Dashboard = ({
  live,
  dailyTrend,
  paceTrends,
  chartBreakdowns = EMPTY_CHART_BREAKDOWNS,
  streets,
  recentInfringements,
  recentInfringementsTotal,
  connectionStatus = "connecting",
  dataStatus = "loading",
  error,
}: DashboardProps) => {
  const [recentOpen, setRecentOpen] = useState(false);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 md:px-8 lg:py-10">
        <header className="border-border mb-6 border-b pb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                Hamilton City Council Open Data
              </p>
              <h1 className="text-primary text-3xl font-semibold tracking-tighter sm:text-5xl">
                Hamilton parking infringements
              </h1>
              <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-6 sm:text-base">
                Live infringement totals, hotspot streets, vehicle trends, and
                ticket activity for Hamilton, New Zealand.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <LiveStatusBadge connectionStatus={connectionStatus} />
                {dataStatus === "updating" ? (
                  <Badge variant="status">Updating...</Badge>
                ) : null}
                <ThemeToggle />
              </div>
              <LastUpdated
                lastSyncedAt={live.lastSyncedAt}
                dataStatus={dataStatus}
              />
            </div>
          </div>
        </header>

        {error !== null && error !== undefined && error.length > 0 ? (
          <Alert variant="destructiveNotice" className="mb-6">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertTitle>Dashboard update failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <main className="grid min-w-0 gap-6">
          <LiveTicker
            stats={live}
            dailyTrend={dailyTrend}
            paceTrends={paceTrends}
            isLoading={dataStatus === "loading"}
          />
          <DailyTrendPanel
            dailyTrend={dailyTrend}
            isLoading={dataStatus === "loading"}
          />
          <details className="border-border bg-card rounded-lg border p-5 sm:p-6">
            <summary className="focus-visible:outline-ring cursor-pointer font-medium focus-visible:outline-2">
              Street and vehicle breakdowns
            </summary>
            <div className="mt-6">
              <DistributionCharts
                breakdowns={chartBreakdowns}
                streets={streets}
                isLoading={dataStatus === "loading"}
              />
            </div>
          </details>
          <details
            className="border-border bg-card rounded-lg border p-5 sm:p-6"
            onToggle={(event) => {
              setRecentOpen(event.currentTarget.open);
            }}
          >
            <summary className="focus-visible:outline-ring cursor-pointer font-medium focus-visible:outline-2">
              Recent parking tickets
            </summary>
            <div className="mt-6">
              {recentOpen ? (
                <LatestInstances
                  recentInfringements={recentInfringements}
                  total={recentInfringementsTotal}
                  isLoading={dataStatus === "loading"}
                />
              ) : null}
            </div>
          </details>
        </main>

        <footer className="border-border text-muted-foreground mt-8 border-t pt-5 text-xs">
          <p>
            Parking infringement data from{" "}
            <a
              className="hover:text-foreground underline underline-offset-2"
              href="https://data-waikatolass.opendata.arcgis.com/datasets/hcc::infringement/about"
              rel="noopener noreferrer"
              target="_blank"
            >
              HCC infringement dataset
            </a>
            , licensed under{" "}
            <a
              className="hover:text-foreground underline underline-offset-2"
              href="https://creativecommons.org/licenses/by/4.0/"
              rel="noopener noreferrer"
              target="_blank"
            >
              CC BY 4.0
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
};
