// input/input.tsx
import clsx from "clsx";
import React, { memo } from "react";
import { FaRegClock, FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { currencyFormat } from "../../../utils/common";
import type { InputProps } from "./types";

import {
  getCurrentTime,
  normalizeDecimalString,
  normalizeOnInput,
  normalizePhoneInput,
  normalizeTimeInput,
  patchEventValue,
  preventComma,
} from "./helper";

export const Input: React.FC<InputProps> = memo(({
  id,
  label,
  required,
  error,
  hint,
  type = "text",
  size = "md",
  variant = "default",
  prefix,
  suffix,
  disabled,
  value,
  onChange,
  className,
  hidden,
  ...rest
}) => {
  const [secured, setSecured] = React.useState("password");

  const sizeClassMap = {
    xs: "input-xs",
    sm: "input-sm",
    md: "input-md",
    lg: "input-lg",
    xl: "input-xl",
  }[size];

  const variantClassMap = error
    ? "input-error !border-error !text-error"
    : {
        default: "input-default",
        neutral: "input-neutral",
        primary: "input-primary",
        secondary: "input-secondary",
        accent: "input-accent",
        info: "input-info",
        success: "input-success",
        warning: "input-warning !border-warning",
        error: "input-error",
      }[variant];

  const renderLabel = () =>
    label && (
      <label htmlFor={id} className="pb-2 block" id={`${id}-label`}>
        <span className="text-base-content text-[10px] leading-[1.2] uppercase font-semibold tracking-[.6px]">
          {label} {required && <span className="text-error">*</span>}
        </span>
      </label>
    );

  const renderError = () =>
    error && (
      <div className="text-error text-xs font-medium leading-[1.66] pt-1" role="alert" id={`${id}-error`}>
        {error}
      </div>
    );

  const renderHint = () =>
    hint && (
      <div className="text-base-content text-xs font-normal leading-[1.66] pt-1" id={`${id}-hint`}>
        {hint}
      </div>
    );

  const inputClass = clsx(
    "input no-spinner ",
    sizeClassMap,
    variantClassMap,
    {
      "!border-base-300 !text-gray-400": disabled,
      "!pl-10": prefix,
      "!pr-10": type === "password" || suffix,
    },
    className
  );

  // Build ARIA attributes for accessibility
  const ariaAttrs: Record<string, any> = {};
  if (label) ariaAttrs["aria-labelledby"] = `${id}-label`;
  if (error) ariaAttrs["aria-describedby"] = `${id}-error`;
  else if (hint) ariaAttrs["aria-describedby"] = `${id}-hint`;
  if (required) ariaAttrs["aria-required"] = true;
  if (disabled) ariaAttrs["aria-disabled"] = true;

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: raw,
      },
    };
    onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
  };

  const renderField = () => {
    if (type === "textarea") {
      return (
        <textarea
          {...rest}
          {...ariaAttrs}
          id={id}
          value={value}
          onChange={onChange}
          className={clsx(inputClass, "min-h-30")}
        />
      );
    }

    if (type === "currency") {
      return (
        <input
          {...rest}
          {...ariaAttrs}
          id={id}
          type="text"
          className={inputClass}
          value={value && currencyFormat(value, prefix ? false : true)}
          onChange={handleCurrencyChange}
          disabled={disabled}
        />
      );
    }

    if (type === "number") {
      // HTML props already allow numeric min/max on `rest`
      const min = typeof rest.min === "number" ? rest.min : undefined;
      const max = typeof rest.max === "number" ? rest.max : undefined;

      return (
        <input
          {...rest}
          {...ariaAttrs}
          id={id}
          type="text"
          value={value}
          className={inputClass}
          disabled={disabled}
          onKeyDown={(e) => {
            preventComma(e);
            rest.onKeyDown?.(e);
          }}
          onInput={(e) => {
            normalizeOnInput(e, min, max);
            rest.onInput?.(e);
          }}
          onChange={(e) => {
            const normalized = normalizeDecimalString(
              e.currentTarget.value,
              min,
              max
            );
            // if changed, forward a patched event so parent receives normalized value
            if (normalized !== e.currentTarget.value) {
              onChange?.(patchEventValue(e, normalized));
            } else {
              onChange?.(e);
            }
          }}
        />
      );
    }

    if (type === "time") {
      return (
        <input
          {...rest}
          {...ariaAttrs}
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="--:--"
          value={value}
          className={inputClass}
          disabled={disabled}
          onChange={(e) => {
            const normalized = normalizeTimeInput(e.target.value);
            onChange?.(patchEventValue(e, normalized));
          }}
        />
      );
    }

    if (type === "phone") {
      return (
        <input
          {...rest}
          {...ariaAttrs}
          id={id}
          type="tel"
          value={value}
          className={inputClass}
          disabled={disabled}
          placeholder={rest.placeholder ?? "08xxxxxxxxxx"}
          onChange={(e) => {
            const normalized = normalizePhoneInput(e.target.value);

            if (normalized !== e.target.value) {
              onChange?.(patchEventValue(e, normalized));
            } else {
              onChange?.(e);
            }
          }}
        />
      );
    }

    return (
      <input
        {...rest}
        {...ariaAttrs}
        id={id}
        type={type === "password" ? secured : type}
        value={value}
        onChange={onChange}
        className={inputClass}
        disabled={disabled}
      />
    );
  };

  if (hidden) return null;

  return (
    <div className="w-full">
      {renderLabel()}
      <div className="relative w-full flex items-center">
        {prefix && <div className="absolute left-3">{prefix}</div>}

        {renderField()}

        {type === "password" ? (
          <button
            type="button"
            className="absolute right-3 cursor-pointer bg-transparent border-0 p-0"
            onClick={() => setSecured(secured === "password" ? "text" : "password")}
            aria-label={secured === "password" ? "Show password" : "Hide password"}
          >
            {secured === "password" ? (
              <FaRegEye aria-hidden="true" />
            ) : (
              <FaRegEyeSlash aria-hidden="true" />
            )}
          </button>
        ) : type === "time" ? (
          <button
            type="button"
            className="absolute right-3 cursor-pointer bg-transparent border-0 p-0"
            onClick={() => {
              const now = getCurrentTime();

              onChange?.({
                target: {
                  value: now,
                },
              } as React.ChangeEvent<HTMLInputElement>);
            }}
            aria-label="Set current time"
          >
            <FaRegClock aria-hidden="true" />
          </button>
        ) : (
          suffix && <div className="absolute right-3">{suffix}</div>
        )}
      </div>
      {renderHint()}
      {renderError()}
    </div>
  );
});

Input.displayName = "Input";
