import type { ReactNode } from "react";

export type NavbarProps = {
  background?: "base" | "primary" | "secondary" | "accent";
  shadow?: boolean;
  className?: string;
  children: ReactNode;
};

export type NavbarSlotProps = {
  children: ReactNode;
  className?: string;
};
