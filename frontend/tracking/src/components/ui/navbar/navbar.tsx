import clsx from "clsx";
import type { NavbarProps } from "./types";

export const Navbar = ({
  background = "base",
  shadow = true,
  className,
  children,
}: NavbarProps) => {
  const backgroundClass = {
    base: "bg-base-100",
    primary: "bg-primary",
    secondary: "bg-secondary",
    accent: "bg-accent",
  }[background];

  const wrapperClass = clsx(
    "navbar",
    backgroundClass,
    shadow && "shadow-sm",
    className
  );

  return <div className={wrapperClass}>{children}</div>;
};
