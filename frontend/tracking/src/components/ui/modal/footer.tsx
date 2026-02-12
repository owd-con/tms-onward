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
    <div className={clsx("flex justify-end gap-2", className)}>{children}</div>
  );
};

export default Footer;
