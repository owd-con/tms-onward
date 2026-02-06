import clsx from "clsx";
import type { ReactNode } from "react";

const Body = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("mb-4 overflow-y-auto overflow-x-hidden px-4 sm:px-0 flex-1", className)}>
      {children}
    </div>
  );
};

export default Body;
