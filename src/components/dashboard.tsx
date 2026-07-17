import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CalendarRange,
  CarFront,
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
import { numberFmt } from "@/lib/format";
import type { PaceTrends } from "@/lib/trend-window";

export type DashboardConnectionStatus = "live" | "cached" | "connecting";
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
      <p className="text-sm text-muted-foreground">Waiting for first sync...</p>
    );
  }

  let syncedAt: Date;
  try {
    syncedAt = parseAucklandInstant(lastSyncedAt);
  } catch {
    return (
      <p className="text-sm text-muted-foreground">Waiting for first sync...</p>
    );
  }

  const ago = formatDistanceToNow(syncedAt, { addSuffix: true });

  return (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
      Last updated <span className="font-medium text-primary">{ago}</span>
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
    <button
      type="button"
      className="inline-flex h-8 items-center gap-2 rounded-[6px] border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--ring)] focus-visible:outline-none"
      onClick={() => {
        setTheme(isLight ? "dark" : "light");
      }}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      {isLight ? (
        <Moon className="size-4" aria-hidden="true" />
      ) : (
        <Sun className="size-4" aria-hidden="true" />
      )}
      {isLight ? "Dark" : "Light"}
    </button>
  );
};

const LiveStatusBadge = ({
  connectionStatus = "connecting",
}: {
  connectionStatus?: DashboardConnectionStatus;
}) => {
  if (connectionStatus === "live") {
    return (
      <Badge
        variant="secondary"
        className="gap-1.5 border-[color-mix(in_srgb,#00ca50_35%,transparent)] bg-[color-mix(in_srgb,#00ca50_12%,var(--background))] text-[#00ca50]"
      >
        <Activity className="size-3" aria-hidden="true" />
        WebSocket Live
      </Badge>
    );
  }

  if (connectionStatus === "cached") {
    return (
      <Badge variant="outline" className="gap-1.5 bg-background">
        <Database className="size-3" aria-hidden="true" />
        Cached
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5 bg-background">
      <Database className="size-3" aria-hidden="true" />
      Connecting
    </Badge>
  );
};

const AtAGlance = ({
  live,
  isLoading,
}: {
  live: PublicLiveStats;
  isLoading: boolean;
}) => {
  const lastRecordLabel = (() => {
    if (live.lastRecordAt === null || live.lastRecordAt.length === 0) {
      return "Awaiting records";
    }

    try {
      return formatDistanceToNow(parseAucklandInstant(live.lastRecordAt), {
        addSuffix: true,
      });
    } catch {
      return "Awaiting records";
    }
  })();

  const metrics = [
    {
      description: "Recorded in the current local day",
      icon: CalendarDays,
      label: "Today",
      value: numberFmt.format(live.today),
    },
    {
      description: "Recorded since the first of the month",
      icon: CalendarRange,
      label: "This month",
      value: numberFmt.format(live.thisMonth),
    },
    {
      description: "Marked as towed in today's records",
      icon: CarFront,
      label: "Towed today",
      value: numberFmt.format(live.towedToday),
    },
    {
      description: "Time since the newest record in the feed",
      icon: Clock3,
      label: "Latest record",
      value: lastRecordLabel,
    },
  ];

  return (
    <section
      aria-label="Latest reporting snapshot"
      className="overflow-hidden rounded-[6px] border border-border bg-muted/20"
    >
      <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div className="min-w-0 px-4 py-3.5" key={metric.label}>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5" aria-hidden="true" />
                {metric.label}
              </div>
              {isLoading ? (
                <Skeleton className="mt-2 h-7 w-24" />
              ) : (
                <p className="mt-1 font-mono text-xl font-semibold tracking-[-0.035em] text-foreground tabular-nums">
                  {metric.value}
                </p>
              )}
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

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
}: DashboardProps) => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto w-full px-4 py-6 sm:px-6 md:px-8 xl:px-10 2xl:px-12">
      <header className="mb-6 border-b border-border pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
              Hamilton City Council Open Data
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-primary sm:text-5xl">
              Parking Infringement Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              A clear view of recorded parking infringements: what is happening
              now, how activity is changing, and where tickets are concentrated.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <LiveStatusBadge connectionStatus={connectionStatus} />
              {dataStatus === "updating" ? (
                <Badge variant="outline" className="bg-background">
                  Updating...
                </Badge>
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
        <Alert variant="destructive" className="mb-6 bg-background">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Dashboard update failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <main className="grid min-w-0 gap-6">
        <AtAGlance live={live} isLoading={dataStatus === "loading"} />
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
        <DistributionCharts
          breakdowns={chartBreakdowns}
          streets={streets}
          isLoading={dataStatus === "loading"}
        />
        <LatestInstances
          recentInfringements={recentInfringements}
          total={recentInfringementsTotal}
          isLoading={dataStatus === "loading"}
        />
      </main>

      <footer className="mt-8 border-t border-border pt-5 text-xs text-muted-foreground">
        <p>
          Parking infringement data from{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href="https://data-waikatolass.opendata.arcgis.com/datasets/hcc::infringement/about"
            rel="noopener noreferrer"
            target="_blank"
          >
            HCC infringement dataset
          </a>
          , licensed under{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
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
