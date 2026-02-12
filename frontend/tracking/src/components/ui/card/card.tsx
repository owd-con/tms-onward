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
  const sizeClass = {
    xs: "w-60",
    sm: "w-72",
    md: "w-96",
    lg: "w-[28rem]",
    xl: "w-[32rem]",
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
    "card shadow-sm",
    variantClass,
    sizeClass,
    backgroundClass,
    textColorClass,
    className
  );

  return <div className={wrapperClass}>{children}</div>;
};
