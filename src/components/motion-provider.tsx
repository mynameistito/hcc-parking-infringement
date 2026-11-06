import { domAnimation, LazyMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Provide asynchronously loaded animation features.
 * @returns The rendered interface for the supplied data.
 */
export const MotionProvider = ({ children }: { children: ReactNode }) => (
  <LazyMotion features={domAnimation} strict>
    {children}
  </LazyMotion>
);
