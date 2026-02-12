import { Badge, type BadgeVariant } from "@/components";
import type { ReactNode, ComponentType } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export const toNum = (val: string | number | null | undefined) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  if (val.trim() === "") return null;
  const parsed = Number(val);
  return isNaN(parsed) ? null : parsed;
};

const statusVariant: Record<string, BadgeVariant> = {
  new: "default",
  process: 'info',
  published: 'info',
  active: "success",
  inactive: "error",
  disputed: "error",
  completed: "success",
  received: "success",
  // Order status
  draft: "default",
  pending: "warning",
  confirmed: "info",
  dispatched: "info",
  in_transit: "info",
  delivered: "success",
  cancelled: "error",
  failed: "error",
  // Trip status
  planned: "default",
  in_progress: "info",
  // Waypoint status
  skipped: "default",
};

export function statusBadge(status: string): ReactNode {
  const normalized = status.toLowerCase();
  const variant = statusVariant[normalized] || "default";
  const label = normalized.replace(/_/g, " ");

  return (
    <Badge variant={variant} size="sm" className="capitalize!">
      {label}
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
  value: unknown
): T | null {
  return options.find((o) => o.value === value) || null;
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay = 250
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Get icon component and background classes for waypoint/trip status
 */
export interface WaypointIconResult {
  icon: ComponentType<{ className?: string }>;
  bgClass: string;
}

export function getWaypointIcon(status: string): WaypointIconResult {
  const statusLower = status?.toLowerCase() || '';

  if (statusLower === 'completed') {
    return {
      icon: CheckCircleIcon,
      bgClass: 'bg-green-100 text-green-600',
    };
  }

  if (statusLower === 'failed') {
    return {
      icon: XCircleIcon,
      bgClass: 'bg-red-100 text-red-600',
    };
  }

  if (statusLower === 'in_transit' || statusLower === 'pending') {
    return {
      icon: ClockIcon,
      bgClass: 'bg-blue-100 text-blue-600',
    };
  }

  return {
    icon: InformationCircleIcon,
    bgClass: 'bg-gray-100 text-gray-600',
  };
}
