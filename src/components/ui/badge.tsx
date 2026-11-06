import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { badgeVariants } from "@/components/ui/badge-variants";
import { cn } from "@/lib/utils";

const Badge = ({
  className,
  variant = "default",
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) => (
  <span
    data-slot="badge"
    data-variant={variant}
    className={cn(badgeVariants({ variant }), className)}
    {...props}
  />
);

export { Badge };
