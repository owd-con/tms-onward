import clsx from "clsx";
import type { ReactNode } from "react";
import { memo } from "react";

const Footer = memo(({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={clsx("flex justify-end gap-2", className)}>{children}</div>
  );
});

Footer.displayName = "Modal.Footer";

export default Footer;
