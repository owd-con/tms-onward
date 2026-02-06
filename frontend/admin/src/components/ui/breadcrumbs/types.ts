import type { ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  disabled?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: string | ReactNode;
  className?: string;
}
