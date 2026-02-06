import clsx from "clsx";
import type { DividerProps } from "./types";

export const Divider = ({
  children,
  direction = "vertical",
  variant = "default",
  placement = "default",
  className,
}: DividerProps) => {
  const baseClass = "divider";

  const directionClass = {
    horizontal: "divider-horizontal before:!w-[0.5px] after:!w-[0.5px]",
    vertical: "divider-vertical before:!h-[0.5px] after:!h-[0.5px]",
  }[direction];

  const placementClass = {
    default: "",
    start: "divider-start",
    end: "divider-end",
  }[placement];

  const variantClass = {
    default: "",
    primary: "divider-primary",
    secondary: "divider-secondary",
    accent: "divider-accent",
    neutral: "divider-neutral",
    info: "divider-info",
    success: "divider-success",
    warning: "divider-warning",
    error: "divider-error",
  }[variant];

  return (
    <div
      className={clsx(
        baseClass,
        directionClass,
        placementClass,
        variantClass,
        className
      )}
    >
      {children}
    </div>
  );
};
