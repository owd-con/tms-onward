// input/input.tsx
import clsx from "clsx";
import React from "react";
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

export const Input: React.FC<InputProps> = ({
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

  const inputClass = clsx(
    "input no-spinner ",
    sizeClassMap,
    variantClassMap,
    {
      "!border-base-300 !text-gray-400": disabled,
      "!pl-10": prefix,
      "!pr-10": type === "password" || suffix,
    },
    // Mobile: Ensure minimum 44px height for touch targets (Apple HIG)
    // and 16px font size to prevent iOS auto-zoom on focus
    "min-h-[44px] mobile-touch-friendly",
    className
  );

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
          <div className="absolute right-3 cursor-pointer">
            {secured === "password" ? (
              <FaRegEye onClick={() => setSecured("text")} />
            ) : (
              <FaRegEyeSlash onClick={() => setSecured("password")} />
            )}
          </div>
        ) : type === "time" ? (
          <div className="absolute right-3">
            <FaRegClock
              onClick={() => {
                const now = getCurrentTime();

                onChange?.({
                  target: {
                    value: now,
                  },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
            />
          </div>
        ) : (
          suffix && <div className="absolute right-3">{suffix}</div>
        )}
      </div>
      {renderHint()}
      {renderError()}
    </div>
  );
};
