import clsx from "clsx";
import { getDefaultIcon } from "./icon";
import { AlertCloseButton } from "./close";
import type { AlertProps } from "./types";

export const Alert = ({
  variant = "default",
  appearance = "default",
  layout = "horizontal",
  size = "md",
  title,
  message,
  icon,
  dismissible,
  shadow,
  border,
  className,
  children,
  onDismiss,
}: AlertProps) => {
  const variantClass = {
    default: "alert",
    info: "alert alert-info",
    success: "alert alert-success",
    warning: "alert alert-warning",
    error: "alert alert-error",
  }[variant];

  const appearanceClass = {
    default: "",
    dash: "alert-dash",
    soft: "alert-soft",
    outline: "alert-outline",
  }[appearance];

  const layoutClass = {
    horizontal: "alert-horizontal",
    vertical: "alert-vertical",
  }[layout];

  const sizeClass = {
    xs: "text-xs py-1 px-2",
    sm: "text-sm py-2 px-3",
    md: "text-base py-3 px-4",
    lg: "text-lg py-4 px-6",
  }[size];

  return (
    <div
      role="alert"
      className={clsx(
        variantClass,
        appearanceClass,
        layoutClass,
        sizeClass,
        shadow && "shadow",
        border && "border",
        "flex flex-col place-items-start",
        className
      )}
    >
      <div className={clsx("flex items-start gap-3")}>
        <div className="pt-1">{icon ?? getDefaultIcon(variant)}</div>
        <div className="flex-1">
          {title && <h4 className="font-bold">{title}</h4>}
          {message && <p className="text-sm opacity-80">{message}</p>}
        </div>
        {dismissible && <AlertCloseButton onClick={onDismiss} />}
      </div>
      {children}
    </div>
  );
};
