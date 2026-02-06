import { createPortal } from "react-dom";
import { useEffect, useRef, useState, memo } from "react";
import type { ModalWrapperProps } from "./types";
import clsx from "clsx";

const Wrapper = memo(({
  open,
  onClose,
  closeOnOutsideClick = true,
  children,
  className,
  ariaLabelledBy,
  ariaDescribedBy,
}: ModalWrapperProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(open);
  const [animationClass, setAnimationClass] = useState("");
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Open & Close trigger
  useEffect(() => {
    if (open) {
      setVisible(true);
      setAnimationClass("modal-fade-in");
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
    } else {
      setAnimationClass("modal-fade-out");
    }
  }, [open]);

  // Focus trap implementation
  useEffect(() => {
    if (!open || !ref.current) return;

    // Focus the modal when it opens
    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first focusable element after a short delay
    const timeoutId = setTimeout(() => {
      if (firstElement) {
        firstElement.focus();
      }
    }, 100);

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleTabKey);
      // Restore focus to previous element when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
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
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose, closeOnOutsideClick]);

  if (!visible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
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
});

if (typeof Wrapper.displayName !== "string") {
  Wrapper.displayName = "Modal.Wrapper";
}

export default Wrapper;
