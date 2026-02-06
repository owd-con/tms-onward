import type { ReactNode } from "react";

export type ModalWrapperProps = {
  open: boolean;
  onClose: () => void;
  closeOnOutsideClick?: boolean;
  children: ReactNode;
  className?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
};
