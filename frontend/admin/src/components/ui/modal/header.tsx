import clsx from "clsx";
import type { ReactNode } from "react";
import { memo } from "react";

const Header = memo(({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) => {
  return (
    <div
      id={id}
      className={clsx("text-lg font-semibold mb-4", className)}
    >
      {children}
    </div>
  );
});

Header.displayName = "Modal.Header";

export default Header;
