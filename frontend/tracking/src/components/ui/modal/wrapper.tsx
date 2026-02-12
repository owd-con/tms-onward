import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { ModalWrapperProps } from "./types";
import clsx from "clsx";

const Wrapper = ({
  open,
  onClose,
  closeOnOutsideClick = true,
  children,
  className,
}: ModalWrapperProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(open);
  const [animationClass, setAnimationClass] = useState("");

  // Open & Close trigger
  useEffect(() => {
    if (open) {
      setVisible(true);
      setAnimationClass("modal-fade-in");
    } else {
      setAnimationClass("modal-fade-out");
    }
  }, [open]);

  const handleAnimationEnd = () => {
    if (!open) {
      setVisible(false);
    }
  };

  // Handle ESC and outside click
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

  if (!visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={ref}
        onAnimationEnd={handleAnimationEnd}
        className={clsx(
          `relative bg-base-100 p-6 rounded-xl shadow-xl max-w-lg w-full`,
          animationClass,
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-2 right-5 text-gray-400 hover:text-gray-600 text-xl"
          aria-label="Close modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Wrapper;
