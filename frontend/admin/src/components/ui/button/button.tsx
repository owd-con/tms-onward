import clsx from "clsx";
import { memo, type ButtonHTMLAttributes, type ReactNode } from "react";
import type {
  ButtonShape,
  ButtonSize,
  ButtonStyle,
  ButtonVariant,
} from "./types";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  styleType?: ButtonStyle;
  isLoading?: boolean;
}

const variantClassMap: Record<ButtonVariant, string> = {
  default: "",
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
  info: "btn-info",
  success: "btn-success",
  warning: "btn-warning",
  error: "btn-error",
};

const sizeClassMap: Record<ButtonSize, string> = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
  xl: "btn-xl",
};

const shapeClassMap: Partial<Record<ButtonShape, string>> = {
  wide: "btn-wide",
  block: "btn-block",
  square: "btn-square",
  circle: "btn-circle",
};

const styleClassMap: Partial<Record<ButtonStyle, string>> = {
  outline: "btn-outline",
  dash: "btn-dash",
  soft: "btn-soft",
  ghost: "btn-ghost",
  link: "btn-link",
};

export const Button = memo(({
  children,
  className,
  variant = "default",
  size = "md",
  shape,
  styleType,
  isLoading,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || isLoading;

  const buttonClass = clsx(
    "btn",
    variantClassMap[variant],
    sizeClassMap[size],
    shape && shapeClassMap[shape],
    styleType && styleClassMap[styleType],
    isDisabled && "btn-disabled",
    className
  );

  // For icon-only buttons (circle/square shape with no text content), aria-label is required
  const hasOnlyIcon = shape && (shape === "circle" || shape === "square") &&
    (typeof children !== "string" || (children as string).trim().length === 0);

  return (
    <button
      className={buttonClass}
      disabled={isDisabled}
      aria-label={ariaLabel || (hasOnlyIcon ? "Button" : undefined)}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <span className="loading loading-spinner" aria-hidden="true"></span>}
      {children}
    </button>
  );
});

Button.displayName = "Button";
