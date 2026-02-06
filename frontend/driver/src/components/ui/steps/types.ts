import type { ReactNode } from "react";

export type StepsSize = "xs" | "sm" | "md" | "lg";

export interface StepsProps {
  steps: StepItem[];
  current?: number;
  vertical?: boolean;
  size?: StepsSize;
  className?: string;
  activeClassName?: string;
}

export interface StepItem {
  label: string;
  description?: string;
  icon?: ReactNode;
  error?: boolean;
  activeClassName?: string;
  className?: string;
}
