import clsx from "clsx";
import type { FilterProps } from "./types";

export const Filter = ({
  name,
  options,
  selected,
  onChange,
  showReset = true,
  className,
  resetClassName,
  labelClassName,
}: FilterProps) => {
  return (
    <form className={clsx("filter", className)}>
      {showReset && (
        <input
          type="reset"
          value="×"
          className={clsx("btn btn-square", resetClassName)}
          onClick={() => onChange?.("")}
        />
      )}

      {options.map((opt) => (
        <input
          key={opt.value}
          type="radio"
          name={name}
          value={opt.value}
          aria-label={opt.label}
          checked={selected === opt.value}
          onChange={() => onChange?.(opt.value)}
          className={clsx("btn btn-square", labelClassName)}
        />
      ))}
    </form>
  );
};
