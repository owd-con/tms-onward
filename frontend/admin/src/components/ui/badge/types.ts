import type { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";

export type BadgeSize = "xs" | "sm" | "md" | "lg" | "xl";

export type BadgeAppearance = "default" | "outline" | "dash" | "soft" | "ghost";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  appearance?: BadgeAppearance;
}
