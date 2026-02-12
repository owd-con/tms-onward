import type { ReactNode } from "react";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  position?: "left" | "right";
  closeOnOutsideClick?: boolean;
  className?: string;
  closeButton?: boolean;
};
