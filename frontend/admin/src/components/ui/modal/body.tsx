import clsx from "clsx";
import type { ReactNode } from "react";
import { memo } from "react";

const Body = memo(({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={clsx("mb-4", className)}>{children}</div>;
});

Body.displayName = "Modal.Body";

export default Body;
