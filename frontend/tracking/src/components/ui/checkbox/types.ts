import type { InputHTMLAttributes, ReactNode } from "react";

export type CheckboxSize = "xs" | "sm" | "md" | "lg";
export type CheckboxVariant =
  | "default"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";
export type CheckboxPosition = "left" | "right";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  indeterminate?: boolean;
  size?: CheckboxSize;
  variant?: CheckboxVariant;
  labelClassName?: string;
  labelPosition?: CheckboxPosition;
}
