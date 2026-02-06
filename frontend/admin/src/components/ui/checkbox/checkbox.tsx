import clsx from "clsx";
import { useEffect, useRef, memo } from "react";
import type { CheckboxProps } from "./types";

export const Checkbox = memo(({
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
    <label className={clsx("flex items-center gap-2 cursor-pointer", labelClassName)}>
      {labelPosition === "left" && <span className="label-text">{label}</span>}
      {input}
      {labelPosition === "right" && <span className="label-text">{label}</span>}
    </label>
  ) : (
    input
  );
});

Checkbox.displayName = "Checkbox";
