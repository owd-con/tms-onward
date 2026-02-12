import type { SelectHTMLAttributes, ReactNode } from "react";

export type SelectVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error";

export type SelectSize = "xs" | "sm" | "md" | "lg";

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options: SelectOption[];
  label?: ReactNode;
  size?: SelectSize;
  variant?: SelectVariant;
  bordered?: boolean;
  ghost?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  labelClassName?: string;
}
