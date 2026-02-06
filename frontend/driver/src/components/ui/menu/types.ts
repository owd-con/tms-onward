import type { ReactNode } from "react";

export type MenuItem = {
  label?: string;
  icon?: ReactNode;
  badge?: string | ReactNode;
  disabled?: boolean;
  active?: boolean;
  title?: boolean;
  collapsible?: boolean;
  children?: MenuItem[];
  onClick?: (item: MenuItem) => void;
  hidden?: boolean;
  // Permission requirement - bisa single string atau array
  permission?: string | string[];
  // Jika true, semua permission harus ada (AND logic), default false (OR logic)
  requireAll?: boolean;
};

export type MenuSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface MenuProps {
  items: MenuItem[];
  size?: MenuSize;
  horizontal?: boolean;
  className?: string;
  activeClass?: string;
  inactiveClass?: string;
}
