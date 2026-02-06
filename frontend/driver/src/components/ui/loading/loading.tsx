import clsx from "clsx";
import type { LoadingProps } from "./types";

export const Loading = ({
  size = "md",
  variant = "spinner",
  className,
  center = false,
}: LoadingProps) => {
  const variantClass = {
    spinner: "loading-spinner",
    dots: "loading-dots",
    ring: "loading-ring",
    ball: "loading-ball",
    bars: "loading-bars",
    infinity: "loading-infinity",
  }[variant];

  const sizeClass = {
    xs: "loading-xs",
    sm: "loading-sm",
    md: "loading-md",
    lg: "loading-lg",
  }[size];

  return (
    <span
      className={clsx(
        "loading",
        variantClass,
        sizeClass,
        center && "mx-auto block",
        className
      )}
    />
  );
};
