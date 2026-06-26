import { TopListSkeleton } from "@/components/data-skeletons";
import { EmptyState } from "@/components/shared/empty-state";
import { RankedListRow } from "@/components/shared/ranked-list-row";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TopItem } from "@/contracts/public-api";

export type { TopItem };

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
    return <EmptyState description="Data will appear after the next sync." />;
  }

  const maxCount = Math.max(...items.map((entry) => entry.count), 1);

  return (
    <ol>
      {items.map((item, index) => {
        const width = `${Math.max((item.count / maxCount) * 100, 4)}%`;

        return (
          <li
            key={`${item.label}-${index}`}
            className="border-t border-border/70 first:border-t-0 hover:bg-muted"
          >
            <RankedListRow
              rank={index + 1}
              label={item.label}
              count={item.count}
              showBar
              barWidth={width}
              countClassName="text-sm"
            />
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
