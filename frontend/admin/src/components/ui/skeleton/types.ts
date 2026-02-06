export type SkeletonVariant = "text" | "circle" | "rectangle";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  animated?: boolean;
  width?: number | string;
  height?: number | string;
  rounded?: boolean;
  className?: string;
}
