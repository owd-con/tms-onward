import clsx from "clsx";
import type { SkeletonProps } from "./types";

export const Skeleton = ({
  count = 1,
  variant = "text",
  animated = true,
  width,
  height,
  rounded = true,
  className,
}: SkeletonProps) => {
  const baseClass = "skeleton mb-1";

  const shapeClass = {
    text: "h-4 w-full",
    circle: "rounded-full aspect-square",
    rectangle: "h-32 w-full",
  }[variant];

  const roundedClass = rounded ? "rounded" : "";
  const animationClass = animated ? "" : "bg-base-200 opacity-40";

  const styleClass = clsx(
    baseClass,
    shapeClass,
    width && typeof width === "string" ? width : undefined,
    height && typeof height === "string" ? height : undefined,
    typeof width === "number" ? `!w-[${width}px]` : undefined,
    typeof height === "number" ? `!h-[${height}px]` : undefined,
    roundedClass,
    animationClass,
    className
  );

  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className={styleClass} />
  ));
};
