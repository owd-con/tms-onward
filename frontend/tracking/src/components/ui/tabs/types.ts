import type { ReactNode } from "react";
import type { IndicatorPosition } from "../indicator";

export type TabsVariant = "default" | "boxed" | "bordered" | "lift";
export type TabsSize = "xs" | "sm" | "md" | "lg";
export type TabsPosition = "top" | "bottom";

export interface TabsItem {
  label: ReactNode | string;
  value: string;
  icon?: ReactNode;
  content?: ReactNode | string;
  indicator?: ReactNode | string;
  indicatorPosition?: IndicatorPosition;
  visible?: boolean;
}

export interface TabsProps {
  items: TabsItem[];
  value?: string | number;
  onChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  className?: string;
  tabWrapperClass?: string;
  tabClass?: string;
  contentClass?: string;
  activeClass?: string;
  children?: ReactNode;
}
