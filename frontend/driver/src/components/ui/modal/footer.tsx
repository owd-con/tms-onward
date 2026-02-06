import clsx from "clsx";
import type { ReactNode } from "react";

const Footer = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("flex justify-end gap-2 px-4 sm:px-0 pb-2 sm:pb-0 safe-area-bottom", className)}>
      {children}
    </div>
  );
};

export default Footer;
