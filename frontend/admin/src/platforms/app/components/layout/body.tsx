import clsx from "clsx";
import type { FC, ReactNode } from "react";

interface BodyProps {
  children: ReactNode;
  className?: string;
}

const Body: FC<BodyProps> = ({ className, children }) => {
  return <div className={clsx("p-4 py-0 lg:p-6 lg:py-0", className)}>{children}</div>;
};

export default Body;
