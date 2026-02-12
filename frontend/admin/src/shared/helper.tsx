import { Badge, type BadgeVariant } from "@/components";
import type { ReactNode } from "react";
import dayjs from "dayjs";

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
  dispatched: "primary",
  in_transit: "info",
  cancelled: "error",
  returned: "error",
  failed: "error",
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
