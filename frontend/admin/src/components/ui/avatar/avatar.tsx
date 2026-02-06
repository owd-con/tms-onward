import clsx from "clsx";
import type { AvatarProps } from "./types";
import { memo } from "react";

export const Avatar = memo(({
  src,
  alt = "avatar",
  mask = "default",
  size = "md",
  placeholder = false,
  status = "none",
  className,
  children,
  variant = "default",
}: AvatarProps) => {
  const sizeClass = {
    xs: "w-8 text-xs",
    sm: "w-12 text-sm",
    md: "w-16 text-base",
    lg: "w-20 text-lg",
    xl: "w-24 text-xl",
  }[size];

  const maskClass =
    {
      heart: "mask mask-heart",
      squircle: "mask mask-squircle",
      hexagon: "mask mask-hexagon",
      circle: "rounded-full",
      default: "rounded",
    }[mask] || mask;

  const statusClass = {
    none: "",
    online: "avatar-online",
    offline: "avatar-offline",
  }[status];

  const variantClass = {
    default: "bg-neutral",
    primary: "bg-primary",
    secondary: "bg-secondary",
    accent: "bg-accent",
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
  }[variant];

  return (
    <div
      className={clsx(
        "avatar",
        statusClass,
        placeholder && "avatar-placeholder",
        className
      )}
    >
      <div className={clsx(sizeClass, maskClass, variantClass)}>
        {placeholder ? (
          <span>{children ?? "?"}</span>
        ) : (
          <img src={src} alt={alt} loading="lazy" />
        )}
      </div>
    </div>
  );
});

Avatar.displayName = "Avatar";
