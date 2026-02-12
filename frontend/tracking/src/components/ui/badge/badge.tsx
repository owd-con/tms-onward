import clsx from "clsx";
import type { BadgeProps } from "./types";

export const Badge = ({
  children,
  variant = "default",
  size = "md",
  appearance = "default",
  className,
  ...rest
}: BadgeProps) => {
  const variantClass = {
    default: "badge-neutral",
    primary: "badge-primary",
    secondary: "badge-secondary",
    accent: "badge-accent",
    info: "badge-info",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
  }[variant];

  const sizeClass = {
    xs: "badge-xs",
    sm: "badge-sm",
    md: "badge-md",
    lg: "badge-lg",
    xl: "badge-xl",
  }[size];

  const appearanceClass = {
    default: "",
    outline: "badge-outline",
    dash: "badge-dash",
    soft: "badge-soft",
    ghost: "badge-ghost",
  }[appearance];

  return (
    <div
      className={clsx(
        "badge",
        variantClass,
        sizeClass,
        appearanceClass,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};
