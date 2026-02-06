import clsx from "clsx";
import type { NavbarSlotProps } from "./types";

export const NavbarBrand = ({ children, className }: NavbarSlotProps) => {
  return <div className={clsx("navbar-start", className)}>{children}</div>;
};
