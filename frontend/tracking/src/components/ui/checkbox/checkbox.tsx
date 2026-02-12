import clsx from "clsx";
import { useEffect, useRef } from "react";
import type { CheckboxProps } from "./types";

export const Checkbox = ({
  checked,
  defaultChecked,
  onChange,
  label,
  disabled,
  indeterminate,
  size = "md",
  variant = "default",
  className,
  labelClassName,
  labelPosition = "right",
  ...rest
}: CheckboxProps) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  const sizeClass = {
    xs: "checkbox-xs",
    sm: "checkbox-sm",
    md: "checkbox-md",
    lg: "checkbox-lg",
  }[size];

  const variantClass = {
    default: "",
    primary: "checkbox-primary",
    secondary: "checkbox-secondary",
    accent: "checkbox-accent",
    info: "checkbox-info",
    success: "checkbox-success",
    warning: "checkbox-warning",
    error: "checkbox-error",
  }[variant];

  const input = (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      defaultChecked={defaultChecked}
      onChange={onChange}
      disabled={disabled}
      className={clsx("checkbox", sizeClass, variantClass, className)}
      {...rest}
    />
  );

  return label ? (
    <label className={clsx("flex items-center gap-2 ", labelClassName)}>
      {labelPosition === "left" && <span>{label}</span>}
      {input}
      {labelPosition === "right" && <span>{label}</span>}
    </label>
  ) : (
    input
  );
};
