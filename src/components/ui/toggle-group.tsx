import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";

import { cn } from "@/lib/utils";

const ToggleGroup = ({ className, ...props }: ToggleGroupPrimitive.Props) => (
  <ToggleGroupPrimitive
    data-slot="toggle-group"
    className={(state) =>
      cn(
        "bg-muted flex w-fit items-center gap-0 rounded-lg p-0.5",
        typeof className === "function" ? className(state) : className
      )
    }
    {...props}
  />
);

const ToggleGroupItem = ({ className, ...props }: TogglePrimitive.Props) => (
  <TogglePrimitive
    data-slot="toggle-group-item"
    className={(state) =>
      cn(
        "text-muted-foreground hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground focus-visible:outline-ring inline-flex h-7 items-center justify-center gap-1 rounded-md px-2.5 text-xs font-medium focus-visible:outline-2 disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
        typeof className === "function" ? className(state) : className
      )
    }
    {...props}
  />
);

export { ToggleGroup, ToggleGroupItem };
