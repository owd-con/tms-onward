import type { ReactNode } from "react";

export type AvatarProps = {
  src?: string;
  alt?: string;
  mask?: "heart" | "squircle" | "hexagon" | "circle" | "default";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  placeholder?: boolean;
  status?: "online" | "offline" | "none";
  variant?: AvatarVariant;
  className?: string;
  children?: ReactNode;
};

export type AvatarVariant =
  | "default"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";
