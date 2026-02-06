import clsx from "clsx";
import type { FileInputProps } from "./types";

export const FileInput = ({
  id,
  label,
  error,
  hint,
  required,
  prefix,
  suffix,
  size = "md",
  variant = "neutral",
  bordered,
  ghost,
  disabled,
  className,
  hidden,
  ...rest
}: FileInputProps) => {
  if (hidden) return null;

  const sizeClass = {
    xs: "file-input-xs",
    sm: "file-input-sm",
    md: "file-input-md",
    lg: "file-input-lg",
  }[size];

  const variantClass = error
    ? "file-input-error"
    : {
        primary: "file-input-primary",
        secondary: "file-input-secondary",
        accent: "file-input-accent",
        neutral: "file-input-neutral",
        info: "file-input-info",
        success: "file-input-success",
        warning: "file-input-warning",
        error: "file-input-error",
      }[variant];

  const classes = clsx(
    "file-input",
    sizeClass,
    variantClass,
    bordered && "file-input-bordered",
    ghost && "file-input-ghost",
    className
  );

  const input = (
    <input type="file" className={classes} disabled={disabled} {...rest} />
  );

  const renderLabel = () =>
    label && (
      <label htmlFor={id} className="pb-2 block">
        <span className="text-base-content text-[10px] leading-[1.2] uppercase font-semibold tracking-[.6px]">
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

  const renderHint = () =>
    hint && (
      <div className="text-base-content text-xs font-normal leading-[1.66] pt-1">
        {hint}
      </div>
    );

  if (!label) return input;

  return (
    <div className="w-full">
      {/* <label
        className={clsx(
          "form-control w-full shadow-primary-content flex flex-col",
          labelClassName
        )}
      >
        <span className="label-text mb-1">{label}</span>
        {input}
      </label> */}
      {renderLabel()}
      <div className="flex items-center gap-4">
        {prefix}
        {input}
        {suffix}
      </div>
      {renderHint()}
      {renderError()}
    </div>
  );
};
