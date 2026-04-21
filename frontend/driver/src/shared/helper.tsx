import { Badge, type BadgeVariant } from "@/components";
import type { ReactNode } from "react";

export const toNum = (val: string | number | null | undefined) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  if (val.trim() === "") return null;
  const parsed = Number(val);
  return isNaN(parsed) ? null : parsed;
};

const statusVariant: Record<string, BadgeVariant> = {
  // Trip/Order statuses (snake_case from backend)
  pending: "default",
  planned: "default",
  dispatched: "info",
  in_transit: "info",
  active: "success",
  completed: "success",
  inactive: "error",
  failed: "error",
  cancelled: "error",
};

export function statusBadge(status: string): ReactNode {
  // Normalize: convert to lowercase and replace spaces with underscores
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const variant = statusVariant[normalized] || "default";
  // For display: replace underscores with spaces, CSS will handle capitalize
  const label = normalized.replace(/_/g, " ");

  return (
    <Badge
      variant={variant}
      size='sm'
      appearance='soft'
      className='capitalize! font-semibold!'
    >
      {label}
    </Badge>
  );
}

/**
 * Badge for waypoint type (Pickup/Delivery)
 */
export function typeBadge(type: string): ReactNode {
  const variants: Record<string, string> = {
    pickup: "bg-orange-100 text-orange-700 border-orange-200",
    delivery: "bg-green-100 text-green-700 border-green-200",
  };

  const normalized = type.toLowerCase();
  const variant = variants[normalized] || variants.pickup;

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full border ${variant} capitalize!`}
    >
      {type}
    </span>
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
