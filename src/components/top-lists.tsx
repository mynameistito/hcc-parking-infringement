import { TopListSkeleton } from "@/components/data-skeletons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const numberFmt = new Intl.NumberFormat("en-NZ");

export interface TopItem {
  label: string;
  count: number;
}

interface TopListProps {
  title: string;
  subtitle: string;
  items: TopItem[];
}

const TopListBody = ({
  items,
  isLoading,
}: {
  items: TopItem[];
  isLoading?: boolean;
}) => {
  if (isLoading === true) {
    return <TopListSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="grid min-h-28 place-items-center px-4 py-6 text-center">
        <div>
          <p className="text-sm font-medium text-foreground">No rows yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Data will appear after the next sync.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ol>
      {items.map((item, index) => {
        const maxCount = Math.max(...items.map((entry) => entry.count), 1);
        const width = `${Math.max((item.count / maxCount) * 100, 4)}%`;

        return (
          <li
            key={`${item.label}-${index}`}
            className="border-t border-border/70 px-4 py-3 first:border-t-0 hover:bg-muted"
          >
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2">
              <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="truncate text-sm font-medium" title={item.label}>
                {item.label}
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {numberFmt.format(item.count)}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-[var(--ring)]"
                style={{ width }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
};

const TopList = ({
  title,
  subtitle,
  items,
  isLoading,
}: TopListProps & { isLoading?: boolean }) => (
  <Card className="overflow-hidden py-0">
    <CardHeader className="border-b border-border bg-muted">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{subtitle}</CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      <TopListBody items={items} isLoading={isLoading} />
    </CardContent>
  </Card>
);

interface TopListsProps {
  streets: TopItem[];
  offences: TopItem[];
  layout?: "grid" | "stack";
  isLoading?: boolean;
}

export const TopLists = ({
  streets,
  offences,
  layout = "grid",
  isLoading,
}: TopListsProps) => (
  <div
    className={layout === "grid" ? "grid gap-4 lg:grid-cols-2" : "grid gap-4"}
  >
    <TopList
      title="Top streets"
      subtitle="All-time by infringement count"
      items={streets}
      isLoading={isLoading}
    />
    <TopList
      title="Top offences"
      subtitle="All-time by infringement count"
      items={offences}
      isLoading={isLoading}
    />
  </div>
);
