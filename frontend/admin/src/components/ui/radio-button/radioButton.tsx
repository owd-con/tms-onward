import { useState } from "react";
import type { RadioButtonsProps } from "./types";
import clsx from "clsx";

export const RadioButtons = ({
  options,
  value,
  onChange,
  className,
  activeClassName,
  itemClassName,
}: RadioButtonsProps) => {
  const [internalValue, setInternalValue] = useState(value || "");

  const selected = value ?? internalValue;

  const handleChange = (val: string) => {
    if (val === internalValue) {
      setInternalValue("");
      onChange?.("");
    } else {
      setInternalValue(val);
      onChange?.(val);
    }
  };

  return (
    <div className={clsx("flex gap-2", className)}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className={clsx(
            "cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition select-none",
            selected === opt.value
              ? activeClassName
              : "border-gray-300 text-gray-500",
            itemClassName
          )}
        >
          <input
            type="radio"
            value={opt.value}
            checked={selected === opt.value}
            onClick={() => handleChange(opt.value)}
            className="hidden"
          />
          {opt.icon}
          {opt.label}
        </label>
      ))}
    </div>
  );
};
