import clsx from "clsx";
import type { ReactNode } from "react";

const Header = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("text-lg font-semibold mb-4", className)}>
      {children}
    </div>
  );
};

export default Header;
