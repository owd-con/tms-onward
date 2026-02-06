import clsx from "clsx";
import type { LoadingProps } from "./types";
import { memo } from "react";

export const Loading = memo(({
  size = "md",
  variant = "spinner",
  className,
  center = false,
  label = "Loading...",
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
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
    </span>
  );
});

if (typeof Loading.displayName !== "string") {
  Loading.displayName = "Loading";
}
