import { useRef, useState, memo } from "react";
import clsx from "clsx";
import { useOutsideClick } from "./useOutsideClick";
import type { DropdownProps } from "./types";
import { DropdownItem } from "./item";

interface DropdownComponent extends React.FC<DropdownProps> {
  Item: typeof DropdownItem;
}

const Dropdown: DropdownComponent = memo(({
  value,
  onChange,
  position = "start",
  trigger,
  children,
  className,
  contentClassName,
  open: controlledOpen,
  onOpenChange,
  disabled,
}: DropdownProps) => {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;

  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => {
    if (disabled) return;
    if (!isControlled) setInternalOpen(false);
    onOpenChange?.(false);
  });

  const toggle = () => {
    if (disabled) return;
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleSelect = (val: string) => {
    if (disabled) return;
    onChange?.(val);
    if (!isControlled) setInternalOpen(false);
    onOpenChange?.(false);
  };

  const positionClass = {
    start: "dropdown-start",
    end: "dropdown-end",
    center: "dropdown-center",
    top: "dropdown-top",
    bottom: "dropdown-bottom",
    left: "dropdown-left",
    "left-center": "dropdown-left dropdown-center",
    right: "dropdown-right",
    "right-center": "dropdown-right dropdown-center",
  };

  return (
    <div
      ref={ref}
      tabIndex={disabled ? -1 : 0}
      role="combobox"
      aria-expanded={open}
      aria-disabled={disabled}
      aria-haspopup="listbox"
      className={clsx(
        "dropdown",
        positionClass[position],
        disabled && "pointer-events-none",
        className
      )}
    >
      <div
        onClick={toggle}
        className={clsx("cursor-pointer", disabled && "pointer-events-none")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        {trigger}
      </div>
      {open && !disabled && (
        <ul
          role="listbox"
          className={clsx(
            "dropdown-content menu rounded-box bg-base-100 z-20 w-auto p-2 shadow-md",
            contentClassName
          )}
        >
          {typeof children === "function"
            ? children({ select: handleSelect, selected: value })
            : children}
        </ul>
      )}
    </div>
  );
}) as unknown as DropdownComponent;

(Dropdown as DropdownComponent).displayName = "Dropdown";

Dropdown.Item = DropdownItem;

export { Dropdown };
