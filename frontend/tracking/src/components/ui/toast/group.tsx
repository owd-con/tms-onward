import clsx from "clsx";
import type { ToastItem, ToastPosition } from "./types";

type Props = {
  position: ToastPosition;
  items: ToastItem[];
  onClose: (id: string) => void;
};

const positionClassMap: Record<ToastPosition, string[]> = {
  "top-start": ["toast", "toast-top", "toast-start"],
  "top-center": ["toast", "toast-top", "toast-center"],
  "top-end": ["toast", "toast-top", "toast-end"],
  "bottom-start": ["toast", "toast-bottom", "toast-start"],
  "bottom-center": ["toast", "toast-bottom", "toast-center"],
  "bottom-end": ["toast", "toast-bottom", "toast-end"],
};

export const ToastGroup = ({ position, items, onClose }: Props) => {
  if (!items.length) return null;

  return (
    <div className={clsx(...positionClassMap[position], "z-50")}>
      {items.map(({ id, message, type = "info" }) => (
        <div
          key={id}
          className={clsx(
            "alert",
            {
              "alert-info": type === "info",
              "alert-success": type === "success",
              "alert-error": type === "error",
              "alert-warning": type === "warning",
            },
            "flex justify-between items-center gap-2"
          )}
        >
          <span>{message}</span>
          <button
            onClick={() => onClose(id)}
            className="ml-2"
            aria-label="Close toast"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
