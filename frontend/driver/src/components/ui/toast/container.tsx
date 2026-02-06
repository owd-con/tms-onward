import { useEnigmaUI } from "@/components/enigma";
import { ToastGroup } from "./group";
import type { ToastPosition } from "./types";

export const ToastContainer = () => {
  const { toasts, hideToast } = useEnigmaUI();

  return Object.entries(toasts).map(([position, items]) => (
    <ToastGroup
      key={position}
      position={position as ToastPosition}
      items={items}
      onClose={(id) => hideToast(id, position as ToastPosition)}
    />
  ));
};
