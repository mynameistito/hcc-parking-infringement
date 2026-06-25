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

const TopList = ({ title, subtitle, items }: TopListProps) => (
  <Card className="overflow-hidden py-0">
    <CardHeader className="border-b border-border">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{subtitle}</CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      {items.length === 0 ? (
        <p className="px-4 py-5 text-center text-sm text-muted-foreground">
          No data yet — sync in progress.
        </p>
      ) : (
        <ol>
          {items.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              className="grid grid-cols-[1.75rem_1fr_auto] items-center gap-2 border-t border-border/50 px-4 py-2.5 first:border-t-0 hover:bg-muted/30"
            >
              <span className="font-mono text-xs font-bold text-primary/80">
                {index + 1}
              </span>
              <span className="truncate text-sm" title={item.label}>
                {item.label}
              </span>
              <span className="font-mono text-sm font-bold tabular-nums">
                {numberFmt.format(item.count)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </CardContent>
  </Card>
);

interface TopListsProps {
  streets: TopItem[];
  offences: TopItem[];
}

export const TopLists = ({ streets, offences }: TopListsProps) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <TopList
      title="Top streets"
      subtitle="All-time by infringement count"
      items={streets}
    />
    <TopList
      title="Top offences"
      subtitle="All-time by infringement count"
      items={offences}
    />
  </div>
);
