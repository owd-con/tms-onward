export type LoadingSize = "xs" | "sm" | "md" | "lg";

export type LoadingVariant =
  | "spinner"
  | "dots"
  | "ring"
  | "ball"
  | "bars"
  | "infinity";

export interface LoadingProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  className?: string;
  center?: boolean;
}
