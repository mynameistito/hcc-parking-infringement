import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const LOAD_IN_EASE = [0.22, 1, 0.36, 1] as const;

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
    <motion.div
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
    </motion.div>
  );
};
