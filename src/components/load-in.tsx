import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { LOAD_IN_EASE } from "@/lib/motion-ease";
import { cn } from "@/lib/utils";

interface LoadInProps {
  children: ReactNode;
  className?: string;
  /** Delay before the entrance starts (seconds). */
  delay?: number;
  duration?: number;
  /** Skip motion and render children immediately (e.g. while skeletons show). */
  disabled?: boolean;
}

/** Opacity-only entrance — avoids layout shift from translate animations. */
export const LoadIn = ({
  children,
  className,
  delay = 0,
  duration = 0.45,
  disabled = false,
}: LoadInProps) => {
  const reduceMotion = useReducedMotion() === true;

  if (disabled || reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      animate={{ opacity: 1 }}
      className={cn(className)}
      initial={{ opacity: 0 }}
      transition={{
        delay,
        duration,
        ease: LOAD_IN_EASE,
      }}
    >
      {children}
    </m.div>
  );
};
