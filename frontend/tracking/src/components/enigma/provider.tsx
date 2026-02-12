import { useRef, useState, type ReactNode } from "react";

import type {
  DrawerOptions,
  ModalOptions,
  EnigmaUIState,
  ToastOptions,
} from "./types";
import type { ToastMap, ToastPosition } from "../ui/toast";
import { EnigmaContext } from "./context";

const initialToasts: ToastMap = {
  "top-start": [],
  "top-center": [],
  "top-end": [],
  "bottom-start": [],
  "bottom-center": [],
  "bottom-end": [],
};

export const EnigmaProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<EnigmaUIState>({
    modal: null,
    drawer: null,
  });
  const [toasts, setToasts] = useState<ToastMap>(initialToasts);

  const modalCallbacks = useRef(
    new Map<string, { onOpen?: () => void; onClose?: () => void }>()
  );

  const openModal = ({
    content,
    id = "default",
    onOpen,
    onClose,
  }: ModalOptions) => {
    modalCallbacks.current.set(id, { onOpen, onClose });
    onOpen?.();
    setState((prev) => ({
      ...prev,
      modal: { id, content },
    }));
  };

  const closeModal = (id = "default") => {
    modalCallbacks.current.get(id)?.onClose?.();
    modalCallbacks.current.delete(id);
    setState((prev) => ({
      ...prev,
      modal: null,
    }));
  };

  const drawerCallbacks = useRef(
    new Map<string, { onOpen?: () => void; onClose?: () => void }>()
  );

  const openDrawer = ({
    content,
    id = "default",
    onOpen,
    onClose,
  }: DrawerOptions) => {
    drawerCallbacks.current.set(id, { onOpen, onClose });
    onOpen?.();
    setState((prev) => ({
      ...prev,
      drawer: { id, content },
    }));
  };

  const closeDrawer = (id = "default") => {
    drawerCallbacks.current.get(id)?.onClose?.();
    drawerCallbacks.current.delete(id);
    setState((prev) => ({
      ...prev,
      drawer: null,
    }));
  };

  const showToast = ({
    id = `toast-${Date.now()}`,
    message,
    type = "info",
    position = "bottom-end",
    duration = 3000,
  }: ToastOptions) => {
    setToasts((prev) => ({
      ...prev,
      [position]: [
        ...prev[position].filter((t) => t.id !== id),
        { id, message, type },
      ],
    }));

    setTimeout(() => hideToast(id, position), duration);
  };

  const hideToast = (id: string, position: ToastPosition) => {
    setToasts((prev) => ({
      ...prev,
      [position]: prev[position].filter((t) => t.id !== id),
    }));
  };

  return (
    <EnigmaContext.Provider
      value={{
        openModal,
        closeModal,
        openDrawer,
        closeDrawer,
        showToast,
        hideToast,
        toasts,
        state,
      }}
    >
      {state.modal && <div key={state.modal.id}>{state.modal.content}</div>}
      {state.drawer && <div key={state.drawer.id}>{state.drawer.content}</div>}
      {children}
    </EnigmaContext.Provider>
  );
};
