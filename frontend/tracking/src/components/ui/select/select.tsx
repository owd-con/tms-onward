import clsx from "clsx";
import type { SelectProps } from "./types";

export const Select = ({
  options,
  label,
  required,
  error,
  size = "md",
  variant = "neutral",
  bordered,
  ghost,
  disabled,
  className,
  labelClassName,
  ...rest
}: SelectProps) => {
  const sizeClass = {
    xs: "select-xs",
    sm: "select-sm h-[37px] !p-[8px_10px]",
    md: "select-md h-[47px]",
    lg: "select-lg",
  }[size];

  const variantClass = error
    ? "select-error !border-error !text-error"
    : {
        primary: "select-primary",
        secondary: "select-secondary",
        accent: "select-accent",
        neutral: "select-neutral",
        info: "select-info",
        success: "select-success",
        warning: "select-warning",
        error: "select-error",
      }[variant];

  const classes = clsx(
    "select",
    disabled && "!text-base-100",
    sizeClass,
    variantClass,
    bordered && "select-bordered",
    ghost && "select-ghost",
    className
  );

  const select = (
    <select className={classes} disabled={disabled} {...rest}>
      {options.map((opt, i) => (
        <option key={i} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  const renderLabel = () =>
    label && (
      <label className="pb-2 block">
        <span
          className={clsx(
            "text-base-content text-[10px] leading-[1.2] uppercase font-semibold tracking-[.6px]",
            labelClassName
          )}
        >
          {label} {required && <span className="text-error">*</span>}
        </span>
      </label>
    );

  const renderError = () =>
    error && (
      <div className="text-error text-xs font-medium leading-[1.66] pt-1">
        {error}
      </div>
    );

  return (
    <div className="w-full">
      {renderLabel()}
      {select}
      {renderError()}
    </div>
  );
};
