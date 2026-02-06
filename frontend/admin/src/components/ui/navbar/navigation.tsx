import clsx from "clsx";
import type { NavbarSlotProps } from "./types";

export const NavbarNavigation = ({ children, className }: NavbarSlotProps) => {
  return (
    <div className={clsx("navbar-center hidden lg:flex", className)}>
      {children}
    </div>
  );
};
