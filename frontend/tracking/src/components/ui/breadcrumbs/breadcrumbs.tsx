import clsx from "clsx";
import type { BreadcrumbsProps } from "./types";
import { BreadcrumbItemComponent } from "./item";

export const Breadcrumbs = ({
  items,
  separator = "/",
  className,
}: BreadcrumbsProps) => {
  return (
    <nav className={clsx("text-sm", className)} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <BreadcrumbItemComponent
            key={i}
            {...item}
            isLast={i === items.length - 1}
            separator={separator}
          />
        ))}
      </ol>
    </nav>
  );
};
