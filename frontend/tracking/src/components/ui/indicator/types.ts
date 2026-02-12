import type { ReactNode } from "react";

export type IndicatorPosition =
  | "top-start"
  | "top-center"
  | "top-end"
  | "middle-start"
  | "middle-center"
  | "middle-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end";

export interface IndicatorProps {
  children?: ReactNode;
  indicator?: ReactNode;
  position?: IndicatorPosition;
  className?: string;
}
