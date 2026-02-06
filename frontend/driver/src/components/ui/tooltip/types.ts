import type { ReactNode } from "react";

export type TooltipPosition = "top" | "bottom" | "left" | "right";
export type TooltipSize = "xs" | "sm" | "md" | "lg";
export type TooltipVariant =
  | "default"
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";

export interface TooltipProps {
  children: ReactNode;
  label: ReactNode;
  position?: TooltipPosition;
  size?: TooltipSize;
  variant?: TooltipVariant;
  className?: string;
}
