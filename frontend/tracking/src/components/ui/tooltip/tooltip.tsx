/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import type { TooltipProps } from "./types";

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  label,
  position = "top",
  size = "md",
  variant = "default",
  className,
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (position) {
        case "top":
          top = rect.top + window.scrollY;
          left = rect.left + rect.width / 2 + window.scrollX;
          break;
        case "bottom":
          top = rect.bottom + window.scrollY;
          left = rect.left + rect.width / 2 + window.scrollX;
          break;
        case "left":
          top = rect.top + rect.height / 2 + window.scrollY;
          left = rect.left + window.scrollX;
          break;
        case "right":
          top = rect.top + rect.height / 2 + window.scrollY;
          left = rect.right + window.scrollX;
          break;
      }

      setCoords({ top, left });
    }
  }, [show, position]);

  const sizeClass = {
    xs: "text-xs px-2 py-1",
    sm: "text-sm px-2 py-1",
    md: "text-base px-3 py-1.5",
    lg: "text-lg px-4 py-2",
  }[size];

  const variantClass = {
    default: "bg-base-100 text-base-content",
    neutral: "bg-neutral text-base-100",
    primary: "bg-primary text-base-100",
    secondary: "bg-secondary text-base-100",
    accent: "bg-accent text-base-100",
    info: "bg-info text-base-100",
    success: "bg-success text-base-100",
    warning: "bg-warning text-base-100",
    error: "bg-error text-base-100",
  }[variant];

  const arrowClass = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2 rotate-45",
    bottom: "top-[-4px] left-1/2 -translate-x-1/2 rotate-45",
    left: "right-[-4px] top-1/2 -translate-y-1/2 rotate-45",
    right: "left-[-4px] top-1/2 -translate-y-1/2 rotate-45",
  }[position];

  const tooltip = show && (
    <div
      className={clsx(
        "absolute z-9999 whitespace-pre-wrap rounded shadow-lg transition-opacity",
        sizeClass,
        variantClass,
        className
      )}
      style={{
        top: coords.top,
        left: coords.left,
        transform:
          position === "top"
            ? "translate(-50%, -100%) translateY(-6px)"
            : position === "bottom"
            ? "translate(-50%, 0) translateY(6px)"
            : position === "left"
            ? "translate(-100%, -50%) translateX(-6px)"
            : "translate(0, -50%) translateX(6px)",
      }}
    >
      {label}
      {/* arrow */}
      <div className={clsx("absolute w-2 h-2 bg-inherit", arrowClass)} />
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-block"
      >
        {children}
      </div>
      {createPortal(tooltip, document.body)}
    </>
  );
};
