import clsx from "clsx";
import type { ReactNode } from "react";

const Body = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={clsx("mb-4", className)}>{children}</div>;
};

export default Body;
