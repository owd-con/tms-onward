import clsx from "clsx";
import type { FooterProps } from "./types";

export const Footer = ({ children, className }: FooterProps) => {
  return <footer className={clsx("footer", className)}>{children}</footer>;
};
