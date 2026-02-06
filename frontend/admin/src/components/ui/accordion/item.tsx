import React from "react";
import clsx from "clsx";
import type { AccordionItemProps } from "./types";

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  type = "arrow",
  defaultOpen,
  className,
  titleClassName,
  contentClassName,
  children,
}) => {
  return (
    <div
      className={clsx(
        "collapse",
        {
          "collapse-arrow": type === "arrow",
          "collapse-plus": type === "plus",
        },
        "border border-base-300",
        "join-item",
        className
      )}
    >
      <input type="checkbox" defaultChecked={defaultOpen} />
      <div className={clsx("collapse-title font-semibold", titleClassName)}>
        {title}
      </div>
      <div className={clsx("collapse-content text-sm", contentClassName)}>
        {children}
      </div>
    </div>
  );
};
