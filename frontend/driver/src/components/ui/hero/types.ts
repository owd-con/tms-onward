import type { ReactNode } from "react";

export interface HeroProps {
  children?: ReactNode;
  image?: string;
  overlay?: boolean;
  asForm?: boolean;
  className?: string;
}
