import type { ReactNode } from "react";

export interface RadioOption {
  label: string;
  value: string;
  icon?: ReactNode;
}

export interface RadioButtonsProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  activeClassName?: string;
  itemClassName?: string;
}
