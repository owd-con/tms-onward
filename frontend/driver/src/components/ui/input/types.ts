import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
    "size" | "prefix"
  > {
  id?: string;
  label?: string;
  type?:
    | "text"
    | "password"
    | "email"
    | "number"
    | "textarea"
    | "currency"
    | "phone"
    | "time";
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  value?: string | number;
  size?: InputSize;
  variant?: InputVariant;
  prefix?: ReactNode;
  suffix?: ReactNode;
  placeholder?: string;
  className?: string;
  hidden?: boolean;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

export type InputSize = "xs" | "sm" | "md" | "lg" | "xl";
export type InputVariant =
  | "default"
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";
