import { useId } from "react";
import clsx from "clsx";
import type { TabsProps } from "./types";

export const Tabs = ({
  items,
  value,
  onChange,
  variant = "default",
  size = "md",
  className,
  activeClass = "tab-active",
  tabWrapperClass,
  tabClass,
  contentClass,
  children,
}: TabsProps) => {
  const groupName = useId();

  const baseClass = "tabs";
  const variantClass = {
    default: "",
    boxed: "tabs-box",
    bordered: "tabs-border",
    lift: "tabs-lift",
  }[variant];

  const sizeClass = {
    xs: "tabs-xs",
    sm: "tabs-sm",
    md: "tabs-md",
    lg: "tabs-lg",
  }[size];

  const current = items.find((i) => i.value === value && i.visible !== false);

  return (
    <div
      className={clsx(
        "flex flex-col flex-1 min-h-0 overflow-hidden w-full",
        className
      )}
    >
      <div
        className={clsx(baseClass, variantClass, sizeClass, tabWrapperClass)}
      >
        {items.map((item, index) => {
          if (item?.visible === false) return null;

          const isActive = value === item.value;

          const indicatorPositionClass = {
            "top-start": "indicator-top indicator-start",
            "top-center": "-ms-2 indicator-center",
            "top-end": "indicator-top indicator-end",
            "middle-start": "-mt-2 indicator-middle indicator-start",
            "middle-center": "-mt-2 indicator-middle indicator-center",
            "middle-end": "-mt-2 indicator-middle indicator-end",
            "bottom-start": "indicator-bottom indicator-start",
            "bottom-center": "-ms-2 indicator-bottom indicator-center",
            "bottom-end": "indicator-bottom indicator-end",
          }[item?.indicatorPosition ?? "top-end"];

          return (
            <>
              <label
                key={index}
                className={clsx(
                  "tab",
                  item?.indicator && "indicator",
                  tabClass,
                  isActive && activeClass
                )}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={item.value}
                  checked={isActive}
                  onChange={() => onChange?.(item.value)}
                  className="hidden peer"
                />
                {item.icon && <span className="me-1">{item.icon}</span>}
                {item.label}
                {item.indicator && (
                  <span
                    className={clsx("indicator-item", indicatorPositionClass)}
                  >
                    {item.indicator}
                  </span>
                )}
              </label>
            </>
          );
        })}
      </div>

      {children}

      {current?.content && (
        <div
          className={clsx(
            "tab-content bg-base-100 border-base-300 w-full block",
            contentClass
          )}
        >
          {current?.content}
        </div>
      )}
    </div>
  );
};
