import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { DrawerProps } from "./types";

export const Drawer = ({
  open,
  onClose,
  children,
  position = "right",
  closeOnOutsideClick = true,
  className,
  closeButton = false,
}: DrawerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(open);
  const [animClass, setAnimClass] = useState("");

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setAnimClass(`drawer-slide-in-${position}`);
    } else {
      setAnimClass(`drawer-slide-out-${position}`);
    }
  }, [open, position]);

  const handleAnimationEnd = () => {
    if (!open) setShouldRender(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!closeOnOutsideClick) return;
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose?.();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, closeOnOutsideClick]);

  if (!shouldRender) return null;

  const baseDrawerClass =
    "fixed top-0 h-full w-[22rem] bg-base-100 shadow-xl z-50";

  const positionClass = position === "right" ? "right-0" : "left-0";

  return createPortal(
    <div className="fixed inset-0 z-40">
      {/* Backdrop drawer */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => closeOnOutsideClick && onClose?.()}
      />

      {/* Drawer panel */}
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
        className={`${baseDrawerClass} ${positionClass} ${animClass} ${
          className ?? ""
        } z-50`}
      >
        {closeButton && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close drawer"
          >
            &times;
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};
