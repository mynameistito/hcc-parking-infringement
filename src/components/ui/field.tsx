import { cn } from "@/lib/utils";

const Field = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="field"
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
);

const FieldLabel = ({ className, ...props }: React.ComponentProps<"label">) => (
  <label
    data-slot="field-label"
    className={cn("text-sm font-medium", className)}
    {...props}
  />
);

export { Field, FieldLabel };
