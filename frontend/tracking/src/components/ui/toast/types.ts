export type ToastPosition =
  | "top-start"
  | "top-center"
  | "top-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  message: string;
  type?: ToastType;
};

export type ToastMap = {
  [key in ToastPosition]: ToastItem[];
};

export type ShowToastOptions = {
  id?: string;
  message: string;
  type?: ToastType;
  position?: ToastPosition;
  duration?: number;
};
