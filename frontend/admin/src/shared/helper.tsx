import { Badge, type BadgeVariant } from "@/components";
import type { ReactNode } from "react";
import dayjs from "dayjs";
import {
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiArrowPath,
  HiPlayCircle,
  HiMinusCircle,
} from "react-icons/hi2";

export const toNum = (val: string | number | null | undefined) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  if (val.trim() === "") return null;
  const parsed = Number(val);
  return isNaN(parsed) ? null : parsed;
};

const statusVariant: Record<string, BadgeVariant> = {
  new: "default",
  process: "info",
  published: "info",
  active: "success",
  inactive: "error",
  disputed: "error",
  completed: "success",
  received: "success",
  // TMS Order Status (snake_case from backend)
  pending: "warning",
  planned: "info",
  dispatched: "info",
  in_transit: "info",
  cancelled: "error",
  returned: "error",
  failed: "error",
  // TMS Shipment Status (snake_case from backend)
  on_pickup: "info",
  picked_up: "success",
  on_delivery: "primary",
  delivered: "success",
};

// Waypoint Evidence Type variant (v2.10)
const waypointEvidenceVariant: Record<string, BadgeVariant> = {
  pod: "success",
  failed: "error",
};

export function statusBadge(status: string | undefined): ReactNode {
  if (status === undefined) {
    return (
      <Badge variant='default' size='sm' className='capitalize'>
        -
      </Badge>
    );
  }

  // Normalize: convert to lowercase and replace spaces with underscores
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const variant = statusVariant[normalized] || "default";
  // For display: replace underscores with spaces, CSS will handle capitalize
  const label = normalized.replace(/_/g, " ");

  return (
    <Badge variant={variant} size='sm' className='capitalize'>
      {label}
    </Badge>
  );
}

/**
 * Waypoint Evidence Badge (v2.10)
 * Badge untuk menampilkan tipe evidence waypoint (POD/Failed)
 */
export function waypointEvidenceBadge(type: string | undefined): ReactNode {
  if (type === undefined) {
    return (
      <Badge variant='default' size='sm' className='uppercase'>
        -
      </Badge>
    );
  }

  const normalized = type.toLowerCase();
  const variant = waypointEvidenceVariant[normalized] || "default";

  return (
    <Badge variant={variant} size='sm' className='uppercase'>
      {normalized === "pod" ? "POD" : "Failed"}
    </Badge>
  );
}

export const layoutColorLegend: Record<string, string> = {
  receiving: "#3B82F6",
  storage: "#10B981",
  preparation: "#F59E0B",
  quarantine: "#EF4444",
  other: "#6B7280",
  palette: "#A855F7",
  rack_palette: "#EC4899",
  rack: "#06B6D4",
};

export function getOptionByValue<T extends { value: unknown }>(
  options: T[],
  value: unknown,
): T | null {
  return options.find((o) => o.value === value) || null;
}

export function dateFormat(
  v?: string | Date | dayjs.Dayjs | null,
  format: string = "DD/MM/YYYY HH:mm",
  nullText: string = "-",
): string {
  if (!v) return nullText;

  const date = dayjs(v);

  // Kalau invalid → return nullText
  if (!date.isValid()) return nullText;

  const year = date.year();
  if (year === 1 || year === 1970) {
    return nullText;
  }

  return date.format(format);
}

/**
 * Format Waypoint Log Message (v2.10)
 * Format message waypoint log dari backend ke human-readable format
 */
export function formatWaypointLogMessage(
  message: string | undefined,
  eventType: string | undefined,
): string {
  if (message) return message;

  // Convert event_type to readable format
  return (
    eventType?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || ""
  );
}

/**
 * Shipment Status Badge Helper
 * Returns a badge component for shipment status (reuses existing statusBadge)
 * This is an alias for compatibility - statusBadge already works with any status string
 *
 * @param status - Shipment status string
 * @returns Badge component with appropriate color
 */
export function shipmentStatusBadge(status: string | undefined): ReactNode {
  return statusBadge(status);
}

/**
 * Status Icon Helper
 * Returns an icon for status (compact display for cards)
 * Works for Trip, Shipment, and other entities
 *
 * @param status - Status string
 * @returns Icon with appropriate color
 */

/**
 * Status Colors Helper
 * Returns bgColor and color for status (for headers, cards, etc.)
 * Works for Trip, Shipment, and other entities
 * Consistent with statusBadge variants
 *
 * @param status - Status string
 * @returns Object with bgColor and color classes
 */
export function statusColors(status: string | undefined): { bgColor: string; color: string } {
  if (status === undefined) {
    return { bgColor: "bg-neutral", color: "text-neutral-content" };
  }

  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const variant = statusVariant[normalized] || "default";

  // Map variant to actual tailwind classes
  const variantColors: Record<string, { bgColor: string; color: string }> = {
    default: { bgColor: "bg-neutral/10", color: "text-neutral" },
    info: { bgColor: "bg-info/10", color: "text-info" },
    success: { bgColor: "bg-success/10", color: "text-success" },
    warning: { bgColor: "bg-warning/10", color: "text-warning" },
    error: { bgColor: "bg-error/10", color: "text-error" },
    primary: { bgColor: "bg-primary/10", color: "text-primary" },
  };

  return variantColors[variant] || variantColors.default;
}
export function statusIcon(status: string | undefined): ReactNode {
  if (status === undefined) {
    return <HiMinusCircle className='w-5 h-5 text-base-content/40' />;
  }

  const normalized = status.toLowerCase().replace(/\s+/g, "_");

  // Icon component mapping based on status
  const iconMap: Record<string, { icon: ReactNode; color: string }> = {
    // Success/Completed states
    completed: {
      icon: <HiCheckCircle className='w-5 h-5' />,
      color: "text-success",
    },
    delivered: {
      icon: <HiCheckCircle className='w-5 h-5' />,
      color: "text-success",
    },
    picked_up: {
      icon: <HiCheckCircle className='w-5 h-5' />,
      color: "text-success",
    },
    received: {
      icon: <HiCheckCircle className='w-5 h-5' />,
      color: "text-success",
    },
    active: {
      icon: <HiPlayCircle className='w-5 h-5' />,
      color: "text-success",
    },

    // In Progress states
    in_transit: {
      icon: <HiPlayCircle className='w-5 h-5' />,
      color: "text-info",
    },
    on_pickup: {
      icon: <HiPlayCircle className='w-5 h-5' />,
      color: "text-info",
    },
    on_delivery: {
      icon: <HiPlayCircle className='w-5 h-5' />,
      color: "text-info",
    },
    dispatched: {
      icon: <HiPlayCircle className='w-5 h-5' />,
      color: "text-info",
    },
    process: {
      icon: <HiPlayCircle className='w-5 h-5' />,
      color: "text-info",
    },

    // Waiting/Planned states
    pending: {
      icon: <HiClock className='w-5 h-5' />,
      color: "text-warning",
    },
    planned: {
      icon: <HiClock className='w-5 h-5' />,
      color: "text-info",
    },

    // Error states
    failed: {
      icon: <HiXCircle className='w-5 h-5' />,
      color: "text-error",
    },
    cancelled: {
      icon: <HiXCircle className='w-5 h-5' />,
      color: "text-error",
    },
    inactive: {
      icon: <HiXCircle className='w-5 h-5' />,
      color: "text-error",
    },
    disputed: {
      icon: <HiXCircle className='w-5 h-5' />,
      color: "text-error",
    },

    // Other states
    returned: {
      icon: <HiArrowPath className='w-5 h-5' />,
      color: "text-warning",
    },
    new: {
      icon: <HiMinusCircle className='w-5 h-5' />,
      color: "text-base-content/40",
    },
  };

  const { icon, color } = iconMap[normalized] || {
    icon: <HiMinusCircle className='w-5 h-5' />,
    color: "text-base-content/40",
  };

  return (
    <span className={color} title={normalized.replace(/_/g, " ")}>
      {icon}
    </span>
  );
}

/**
 * Format Shipment Message
 * Format shipment-specific messages with additional context
 * Adds shipment context to log messages or status updates
 *
 * @param message - Base message from backend
 * @param eventType - Event type for formatting
 * @param shipmentNumber - Optional shipment number for context
 * @returns Formatted message string
 */
export function formatShipmentMessage(
  message: string | undefined,
  eventType: string | undefined,
  shipmentNumber?: string,
): string {
  if (message) {
    // If message already exists and we have shipment number, prepend it
    if (shipmentNumber && !message.toLowerCase().includes("shipment")) {
      return `${shipmentNumber}: ${message}`;
    }
    return message;
  }

  // Convert event_type to readable format
  const formattedEvent = eventType
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase()) || "";

  if (shipmentNumber) {
    return `${shipmentNumber}: ${formattedEvent}`;
  }

  return formattedEvent;
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay = 250,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
