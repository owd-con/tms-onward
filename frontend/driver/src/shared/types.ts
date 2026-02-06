export type FormRequestRef = {
  buildPayload: () => Record<string, unknown>;
};

export type WarehouseCanvasRef = {
  fitToScreen: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
};

export type SelectOptionValue = {
  id?: string | number;
  value?: string | number | boolean;
  label?: string;
};
