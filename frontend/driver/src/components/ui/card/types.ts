import type { ReactNode } from "react";
import type { BadgeAppearance, BadgeSize, BadgeVariant } from "../badge/types";

export type CardVariant = "default" | "border" | "dash" | "image-full" | "side";
export type CardSize = "xs" | "sm" | "md" | "lg" | "xl";
export type CardBackground = "base" | "primary" | "secondary" | "accent";
export type CardTextColor = "default" | "primary-content" | "secondary-content";
export type CardMediaPosition = "top" | "bottom";

export type CardProps = {
  variant?: CardVariant;
  size?: CardSize;
  background?: CardBackground;
  textColor?: CardTextColor;
  className?: string;
  children: ReactNode;
};

export type CardMediaProps = {
  src: string;
  alt?: string;
  position?: CardMediaPosition;
  className?: string;
};

export type CardHeaderProps = {
  title: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  badgeSize?: BadgeSize;
  badgeAppearance?: BadgeAppearance;
  className?: string;
};

export type CardActionsProps = {
  className?: string;
  children: ReactNode;
};
