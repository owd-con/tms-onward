import clsx from "clsx";
import type { ReactNode } from "react";

export const CardBody = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={clsx("card-body", className)}>{children}</div>;
};
