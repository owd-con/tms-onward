import clsx from "clsx";
import type { DropdownItemProps } from "./types";

export const DropdownItem = ({
  value = "",
  selected,
  onSelect,
  children,
  className,
}: DropdownItemProps) => {
  const isActive = value === selected;

  return (
    <li>
      <a
        className={clsx(
          "text-sm",
          isActive && "text-primary bg-primary/15",
          className
        )}
        onClick={() => onSelect?.(value)}
      >
        {children}
      </a>
    </li>
  );
};
