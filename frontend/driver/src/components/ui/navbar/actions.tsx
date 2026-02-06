import clsx from "clsx";
import type { NavbarSlotProps } from "./types";

export const NavbarActions = ({ children, className }: NavbarSlotProps) => {
  return <div className={clsx("navbar-end", className)}>{children}</div>;
};
