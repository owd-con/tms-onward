import type { ReactNode } from "react";
import type { ToastMap, ToastItem, ToastPosition } from "../ui/toast";

export type EnigmaUIState = {
  modal: { id: string; content: ReactNode } | null;
  drawer: { id: string; content: ReactNode } | null;
};

export type ModalOptions = {
  id?: string;
  content: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
};

export type DrawerOptions = {
  id?: string;
  content: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
};

export type ToastOptions = {
  id?: string;
  message: string;
  type?: ToastItem["type"];
  position?: ToastPosition;
  duration?: number;
};
export type EnigmaContextType = {
  openModal: (options: ModalOptions) => void;
  closeModal: (id?: string) => void;
  openDrawer: (options: DrawerOptions) => void;
  closeDrawer: (id?: string) => void;
  showToast: (options: ToastOptions) => void;
  hideToast: (id: string, position: ToastPosition) => void;
  toasts: ToastMap;
  state: EnigmaUIState;
};
