import type { InputHTMLAttributes, ReactNode } from "react";

export type RadioVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error";

export type RadioSize = "xs" | "sm" | "md" | "lg";
export type RadioPosition = "left" | "right";

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  variant?: RadioVariant;
  size?: RadioSize;
  className?: string;
  labelClassName?: string;
  labelPosition?: RadioPosition;
}
