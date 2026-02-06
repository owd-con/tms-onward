import type { ReactNode } from "react";

export type AccordionType = "arrow" | "plus";

export interface AccordionItemProps {
  title: string;
  type?: AccordionType;
  defaultOpen?: boolean;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}
