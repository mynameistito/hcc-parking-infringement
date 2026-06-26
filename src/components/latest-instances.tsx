import { format } from "date-fns";

import type { PublicInfringement } from "@/client/api";
import { TableRowsSkeleton } from "@/components/data-skeletons";
import { Card, CardContent } from "@/components/ui/card";

const currencyFmt = new Intl.NumberFormat("en-NZ", {
  currency: "NZD",
  maximumFractionDigits: 0,
  style: "currency",
});

const formatVehicle = (record: PublicInfringement): string => {
  const parts = [record.vehicleMake, record.vehicleModel].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return record.vehicleType ?? "Unknown";
};

interface LatestInstancesProps {
  recentInfringements: PublicInfringement[];
  isLoading?: boolean;
}

export const LatestInstances = ({
  recentInfringements,
  isLoading,
}: LatestInstancesProps) => (
  <Card className="bg-card" aria-label="Latest parking infringements">
    <CardContent className="p-4 sm:p-5 lg:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-primary">Latest Instances</h2>
        <span className="text-xs text-muted-foreground">Newest first</span>
      </div>
      <div className="overflow-auto rounded-[6px] border border-border">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Vehicle</th>
              <th className="px-3 py-2 font-medium">Street</th>
              <th className="px-3 py-2 text-right font-medium">Fine</th>
            </tr>
          </thead>
          {isLoading === true ? (
            <TableRowsSkeleton />
          ) : (
            <tbody className="bg-background">
              {recentInfringements.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-muted-foreground"
                    colSpan={4}
                  >
                    Waiting for infringement rows...
                  </td>
                </tr>
              ) : (
                recentInfringements.map((record) => (
                  <tr
                    key={record.infringementNumber}
                    className="border-t border-border/70"
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-muted-foreground">
                      <time dateTime={record.occurredAt}>
                        {format(new Date(record.occurredAt), "d MMM yy")}
                      </time>
                    </td>
                    <td className="px-3 py-2" title={formatVehicle(record)}>
                      {formatVehicle(record)}
                    </td>
                    <td
                      className="px-3 py-2 text-muted-foreground"
                      title={
                        record.suburb === null || record.suburb.length === 0
                          ? record.street
                          : `${record.street}, ${record.suburb}`
                      }
                    >
                      {record.street}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-semibold tabular-nums">
                      {currencyFmt.format(record.amountCents / 100)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          )}
        </table>
      </div>
    </CardContent>
  </Card>
);
