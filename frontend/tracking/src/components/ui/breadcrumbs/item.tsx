import clsx from "clsx";
import type { BreadcrumbItem } from "./types";

interface BreadcrumbItemComponentProps extends BreadcrumbItem {
  isLast: boolean;
  separator?: React.ReactNode;
}

export const BreadcrumbItemComponent = ({
  label,
  href,
  disabled,
  isLast,
  separator = "/",
}: BreadcrumbItemComponentProps) => {
  const baseClass = "inline-flex items-center gap-1";
  const textClass = disabled
    ? "text-base-content"
    : "text-base-content hover:underline";

  return (
    <li className="flex items-center gap-2">
      {href && !disabled ? (
        <a href={href} className={clsx(baseClass, textClass)}>
          <span>{label}</span>
        </a>
      ) : (
        <span className={clsx(baseClass, textClass)}>{label}</span>
      )}
      {!isLast && <span className="text-base-content/30">{separator}</span>}
    </li>
  );
};
