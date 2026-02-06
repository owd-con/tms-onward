import type { ReactNode } from "react";

export type AlertVariant = "info" | "success" | "warning" | "error" | "default";
export type AlertAppearance = "default" | "dash" | "soft" | "outline";
export type AlertLayout = "horizontal" | "vertical";
export type AlertSize = "xs" | "sm" | "md" | "lg";

export interface AlertProps {
  variant?: AlertVariant;
  appearance?: AlertAppearance;
  layout?: AlertLayout;
  size?: AlertSize;
  title?: string;
  message?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  dismissible?: boolean;
  shadow?: boolean;
  border?: boolean;
  className?: string;
  onDismiss?: () => void;
}
