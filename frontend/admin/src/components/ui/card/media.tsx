import clsx from "clsx";
import type { CardMediaProps } from "./types";
import { memo } from "react";

export const CardMedia = memo(({
  src,
  alt = "",
  position = "top",
  className,
}: CardMediaProps) => {
  const figureClass = {
    top: "",
    bottom: "order-last !rounded-t-none !rounded-b-lg",
  }[position];

  return (
    <figure className={clsx(figureClass, className)}>
      <img src={src} alt={alt} className="object-cover h-full w-full" loading="lazy" />
    </figure>
  );
});

CardMedia.displayName = "CardMedia";
