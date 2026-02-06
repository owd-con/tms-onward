import { type ReactNode, type CSSProperties } from "react";
import clsx from "clsx";

interface BodyProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const Body = ({ children, className, style }: BodyProps) => {
  return (
    <div
      className={clsx("flex-1 min-h-0 overflow-y-auto", className)}
      style={{ paddingBottom: "env(safe-area-inset-bottom)", ...style }}
    >
      {children}
    </div>
  );
};

export default Body;
