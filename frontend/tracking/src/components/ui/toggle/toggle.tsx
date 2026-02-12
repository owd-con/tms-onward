import clsx from "clsx";
import type { ToggleProps } from "./types";

export const Toggle = ({
  label,
  size = "md",
  type = "default",
  variant = "neutral",
  disabled,
  className,
  labelClassName,
  labelPosition = "right",
  ...rest
}: ToggleProps) => {
  const sizeClass = {
    xs: "toggle-xs",
    sm: "toggle-sm",
    md: "toggle-md",
    lg: "toggle-lg",
  }[size];

  const variantClass = {
    primary: "toggle-primary",
    secondary: "toggle-secondary",
    accent: "toggle-accent",
    neutral: "toggle-neutral",
    info: "toggle-info",
    success: "toggle-success",
    warning: "toggle-warning",
    error: "toggle-error",
  }[variant];

  const typeClass = {
    default: "",
    rounded: "toggle-rounded",
    circle: "toggle-circle",
  }[type];

  const toggle = (
    <input
      type="checkbox"
      className={clsx("toggle", sizeClass, typeClass, variantClass, className)}
      disabled={disabled}
      {...rest}
    />
  );

  if (!label) return toggle;

  return (
    <label className={clsx("label gap-2 cursor-pointer", labelClassName)}>
      {labelPosition === "left" && <span className="label-text">{label}</span>}
      {toggle}
      {labelPosition === "right" && <span className="label-text">{label}</span>}
    </label>
  );
};
