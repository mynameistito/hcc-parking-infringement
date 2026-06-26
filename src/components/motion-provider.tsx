import { domAnimation, LazyMotion } from "motion/react";
import type { ReactNode } from "react";

export const MotionProvider = ({ children }: { children: ReactNode }) => (
  <LazyMotion features={domAnimation} strict>
    {children}
  </LazyMotion>
);
