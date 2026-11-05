import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";

import { cn } from "@/lib/utils";

const ToggleGroup = ({ className, ...props }: ToggleGroupPrimitive.Props) => (
  <ToggleGroupPrimitive
    data-slot="toggle-group"
    className={cn(
      "flex w-fit items-center gap-0 rounded-lg bg-muted p-0.5",
      className
    )}
    {...props}
  />
);

const ToggleGroupItem = ({ className, ...props }: TogglePrimitive.Props) => (
  <TogglePrimitive
    data-slot="toggle-group-item"
    className={cn(
      "inline-flex h-7 items-center justify-center gap-1 rounded-md px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50",
      className
    )}
    {...props}
  />
);

export { ToggleGroup, ToggleGroupItem };
