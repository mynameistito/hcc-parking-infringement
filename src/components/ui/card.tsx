import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const cardTreatments = {
  default: "",
  inset: "bg-muted/30 gap-3 py-4",
  panel: "py-0",
  placeholder: "gap-0 py-3",
  plain: "bg-background gap-3 py-4",
  ticket: "gap-2 py-3",
};

const headerTreatments = {
  default: "",
  panel: "border-border border-b",
  responsive: "border-border gap-3 border-b p-4 sm:p-5",
  ticket: "flex items-start justify-between gap-3 px-3 text-xs",
};

const contentTreatments = {
  compact: "px-3",
  default: "",
  grid: "grid gap-4 p-4",
  responsive: "grid gap-4 p-4 sm:p-5",
  roomy: "p-4 sm:p-5 lg:p-6",
  ticket: "px-3 text-xs",
};

const Card = ({
  className,
  size = "default",
  variant = "default",
  ...props
}: ComponentProps<"div"> & {
  size?: "default" | "sm";
  variant?: keyof typeof cardTreatments;
}) => (
  <div
    data-slot="card"
    data-size={size}
    className={cn(
      "group/card bg-card text-card-foreground ring-border flex flex-col gap-(--card-spacing) overflow-hidden rounded-[6px] py-(--card-spacing) text-sm shadow-[0_2px_2px_rgba(0,0,0,0.04)] ring-1 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-[6px] *:[img:last-child]:rounded-b-[6px]",
      className,
      cardTreatments[variant]
    )}
    {...props}
  />
);

const CardHeader = ({
  className,
  variant = "default",
  ...props
}: ComponentProps<"div"> & {
  variant?: keyof typeof headerTreatments;
}) => (
  <div
    data-slot="card-header"
    className={cn(
      "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-[6px] px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
      className,
      headerTreatments[variant]
    )}
    {...props}
  />
);

const CardTitle = ({
  className,
  icon = false,
  ...props
}: ComponentProps<"div"> & { icon?: boolean }) => (
  <div
    data-slot="card-title"
    className={cn(
      "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
      className,
      icon && "flex items-center gap-2"
    )}
    {...props}
  />
);

const CardDescription = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-description"
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
);

const CardContent = ({
  className,
  flush = false,
  variant = "default",
  ...props
}: ComponentProps<"div"> & {
  flush?: boolean;
  variant?: keyof typeof contentTreatments;
}) => (
  <div
    data-slot="card-content"
    className={cn(
      flush ? "p-0" : "px-(--card-spacing)",
      className,
      contentTreatments[variant]
    )}
    {...props}
  />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
