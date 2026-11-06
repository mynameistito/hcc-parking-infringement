import { cn } from "@/lib/utils";

const Skeleton = ({
  className,
  circular = false,
  ...props
}: React.ComponentProps<"div"> & { circular?: boolean }) => (
  <div
    data-slot="skeleton"
    className={cn(
      "bg-muted animate-pulse",
      circular ? "rounded-full" : "rounded-md",
      className
    )}
    {...props}
  />
);

export { Skeleton };
