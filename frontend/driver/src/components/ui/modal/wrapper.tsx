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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 safe-area-top safe-area-bottom">
      <div
        ref={ref}
        onAnimationEnd={handleAnimationEnd}
        className={clsx(
          `relative bg-base-100 rounded-xl shadow-xl w-full max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col`,
          // Mobile: full width with small margins
          `sm:max-w-lg sm:p-6`,
          // Mobile-specific styling
          `mx-0 my-0 sm:mx-auto max-w-[calc(100vw-2rem)]`,
          animationClass,
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-3 right-3 z-10 p-2 text-gray-400 hover:text-gray-600 text-2xl leading-none rounded-full hover:bg-gray-100/50 active:bg-gray-200/50 transition-colors safe-area-top safe-area-right"
          aria-label="Close modal"
          style={{ minWidth: '44px', minHeight: '44px' }}
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
