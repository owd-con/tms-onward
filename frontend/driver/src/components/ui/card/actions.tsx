import clsx from "clsx";
import type { CardActionsProps } from "./types";

export const CardActions = ({ children, className }: CardActionsProps) => {
  return (
    <div className={clsx("card-actions justify-end", className)}>
      {children}
    </div>
  );
};
