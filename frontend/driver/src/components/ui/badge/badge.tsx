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

  // Mobile: slightly larger minimum size for touch targets
  const sizeClass = {
    xs: "badge-xs min-h-[20px]",
    sm: "badge-sm min-h-[24px]",
    md: "badge-md min-h-[28px]",
    lg: "badge-lg min-h-[32px]",
    xl: "badge-xl min-h-[36px]",
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
        "badge inline-flex items-center justify-center touch-manipulation",
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
