import clsx from "clsx";
import type { RadioProps } from "./types";

export const Radio = ({
  label,
  variant = "neutral",
  size = "md",
  disabled,
  className,
  labelClassName,
  labelPosition = "left",
  ...rest
}: RadioProps) => {
  const sizeClass = {
    xs: "radio-xs",
    sm: "radio-sm",
    md: "radio-md",
    lg: "radio-lg",
  }[size];

  const variantClass = {
    primary: "radio-primary",
    secondary: "radio-secondary",
    accent: "radio-accent",
    neutral: "radio-neutral",
    info: "radio-info",
    success: "radio-success",
    warning: "radio-warning",
    error: "radio-error",
  }[variant];

  const radio = (
    <input
      type="radio"
      className={clsx("radio", sizeClass, variantClass, className)}
      disabled={disabled}
      {...rest}
    />
  );

  if (!label) return radio;

  return (
    <label className={clsx("inline-flex items-center gap-2", labelClassName)}>
      {labelPosition === "left" && <span>{label}</span>}
      {radio}
      {labelPosition === "right" && <span>{label}</span>}
    </label>
  );
};
