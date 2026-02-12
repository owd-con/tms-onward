import {
  FiInfo,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
} from "react-icons/fi";
import type { AlertVariant } from "./types";

export const getDefaultIcon = (variant?: AlertVariant) => {
  const iconMap: Record<AlertVariant, React.ReactNode> = {
    default: <FiInfo className="w-5 h-5" />,
    info: <FiInfo className="w-5 h-5" />,
    success: <FiCheckCircle className="w-5 h-5" />,
    warning: <FiAlertTriangle className="w-5 h-5" />,
    error: <FiXCircle className="w-5 h-5" />,
  };
  return iconMap[variant ?? "default"];
};
