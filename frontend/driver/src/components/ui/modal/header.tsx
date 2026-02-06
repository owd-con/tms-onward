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
    <div className={clsx("text-lg font-semibold mb-4 pr-10 px-4 sm:px-0", className)}>
      {children}
    </div>
  );
};

export default Header;
