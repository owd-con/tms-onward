import type { InputHTMLAttributes, ReactNode } from "react";

export type ToggleSize = "xs" | "sm" | "md" | "lg";

export type ToggleVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error";

export type ToggleType = "default" | "rounded" | "circle";
export type TogglePosition = "left" | "right";

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?: ReactNode;
  size?: ToggleSize;
  type?: ToggleType;
  variant?: ToggleVariant;
  labelPosition?: TogglePosition;
  className?: string;
  labelClassName?: string;
}
