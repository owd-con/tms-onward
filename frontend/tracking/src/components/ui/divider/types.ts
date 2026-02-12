import type { ReactNode } from "react";

export type DividerDirection = "horizontal" | "vertical";
export type DividerPlacement = "start" | "end" | "default";
export type DividerVariant =
  | "default"
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "info"
  | "error";

export interface DividerProps {
  children?: ReactNode;
  direction?: DividerDirection;
  placement?: DividerPlacement;
  variant?: DividerVariant;
  className?: string;
}
