import clsx from "clsx";
import type { CardProps } from "./types";

export const Card = ({
  variant = "default",
  size = "md",
  background = "base",
  textColor = "default",
  className,
  children,
}: CardProps) => {
  // Mobile-first: full width, responsive max widths
  const sizeClass = {
    xs: "w-full max-w-[15rem]",
    sm: "w-full max-w-[18rem]",
    md: "w-full max-w-[24rem]",
    lg: "w-full max-w-[28rem]",
    xl: "w-full max-w-[32rem]",
  }[size];

  const variantClass = {
    default: "",
    border: "card-border",
    dash: "card-dash",
    "image-full": "image-full",
    side: "card-side",
  }[variant];

  const backgroundClass = {
    base: "bg-base-100",
    primary: "bg-primary",
    secondary: "bg-secondary",
    accent: "bg-accent",
  }[background];

  const textColorClass = {
    default: "",
    "primary-content": "text-primary-content",
    "secondary-content": "text-secondary-content",
  }[textColor];

  const wrapperClass = clsx(
    "card shadow-sm touch-manipulation",
    variantClass,
    sizeClass,
    backgroundClass,
    textColorClass,
    className
  );

  return <div className={wrapperClass}>{children}</div>;
};
