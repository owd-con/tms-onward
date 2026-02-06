import clsx from "clsx";
import { StepItemComponent } from "./item";
import type { StepsProps } from "./types";

export const Steps = ({
  steps,
  current = 0,
  vertical,
  size = "md",
  className,
  activeClassName,
}: StepsProps) => {
  const sizeClass = {
    xs: "steps-xs",
    sm: "steps-sm",
    md: "steps-md",
    lg: "steps-lg",
  }[size];

  return (
    <ul
      className={clsx(
        "steps min-w-full",
        sizeClass,
        vertical && "steps-vertical",
        className
      )}
    >
      {steps.map((step, index) => (
        <StepItemComponent
          key={index}
          activeClassName={activeClassName}
          {...step}
          index={index}
          isActive={index === current}
          isCompleted={index < current}
          isError={step.error}
        />
      ))}
    </ul>
  );
};
