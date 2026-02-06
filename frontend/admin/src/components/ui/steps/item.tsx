import clsx from "clsx";
import type { StepItem } from "./types";

interface StepItemComponentProps extends StepItem {
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isError?: boolean;
}

export const StepItemComponent = ({
  label,
  description,
  icon,
  index,
  isActive,
  isCompleted,
  isError,
  activeClassName,
  className,
}: StepItemComponentProps) => {
  const isFirst = index === 0;

  const stateClass = clsx({
    "step-primary before:!text-primary": isActive && !isError,
    "step-success": isCompleted && !isActive,
    "step-error before:!text-error": isError,
  });

  const lineFixClass = isFirst ? "before:hidden" : "before:!h-0.5";

  return (
    <li
      data-content={icon ? "" : index + 1}
      className={clsx(
        "step min-w-24 relative",
        stateClass,
        lineFixClass,
        className,
        isActive && activeClassName
      )}
    >
      {icon && <span className="step-icon">{icon}</span>}
      <div className="flex flex-col gap-1 items-start">
        <span className={clsx(isActive ? "font-medium" : "font-thin")}>
          {label}
        </span>
        {description && (
          <span className="text-xs opacity-60">{description}</span>
        )}
      </div>
    </li>
  );
};
