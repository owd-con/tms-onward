import clsx from "clsx";
import type { IndicatorProps } from "./types";

export const Indicator = ({
  children,
  indicator,
  position = "top-end",
  className,
}: IndicatorProps) => {
  const positionClass = {
    "top-start": "indicator-top indicator-start",
    "top-center": "-ms-2 indicator-center",
    "top-end": "indicator-top indicator-end",
    "middle-start": "-mt-2 indicator-middle indicator-start",
    "middle-center": "-ms-2 -mt-2 indicator-middle indicator-center",
    "middle-end": "-mt-2 indicator-middle indicator-end",
    "bottom-start": "indicator-bottom indicator-start",
    "bottom-center": "-ms-2 indicator-bottom indicator-center",
    "bottom-end": "indicator-bottom indicator-end",
  }[position];

  return (
    <div className={clsx("indicator", className)}>
      {indicator && (
        <span className={clsx("indicator-item", positionClass)}>
          {indicator}
        </span>
      )}
      {children}
    </div>
  );
};
