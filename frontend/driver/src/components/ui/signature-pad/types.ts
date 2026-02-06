import type { ReactNode } from "react";

export interface SignaturePadProps {
  /** Whether signature is required for validation */
  required?: boolean;
  /** Whether the pad is disabled */
  disabled?: boolean;
  /** Label text (default: "Digital Signature") */
  label?: string;
  /** Helper text below canvas */
  helperText?: string;
  /** Clear button text */
  clearText?: string;
  /** Error message to display */
  error?: string;
  /** Height of the canvas in pixels (default: 160) */
  height?: number;
  /** Custom class name for the container */
  className?: string;
  /** Callback when signature ends or cleared - receives URL or undefined */
  onEnd?: (url: string | undefined) => void;
  /** Whether to auto-upload signature on end (default: false) */
  autoUpload?: boolean;
  /** File prefix for auto-upload (default: "signature") */
  filePrefix?: string;
  /** Children (not used, kept for compatibility) */
  children?: ReactNode;
}
