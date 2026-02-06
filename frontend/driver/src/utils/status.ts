/**
 * Status utilities for converting between snake_case (API) and Title Case (display)
 */

/**
 * Convert snake_case status to Title Case for display
 * @example "in_transit" → "In Transit"
 */
export function formatStatus(status: string): string {
  if (!status) return "";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Get color variant for status badge
 */
export function getStatusVariant(status: string): "primary" | "info" | "success" | "warning" | "error" {
  const statusMap: Record<string, "primary" | "info" | "success" | "warning" | "error"> = {
    pending: "primary",
    planned: "primary",
    dispatched: "warning",
    in_transit: "info",
    completed: "success",
    failed: "error",
    cancelled: "error",
  };

  return statusMap[status] || "primary";
}

/**
 * Get background color class for status badge
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: "bg-slate-100 text-slate-700 border-slate-200",
    planned: "bg-purple-100 text-purple-700 border-purple-200",
    dispatched: "bg-orange-100 text-orange-700 border-orange-200",
    in_transit: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    cancelled: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return colorMap[status] || colorMap.pending;
}

/**
 * Check if status is active (in_progress)
 */
export function isStatusActive(status: string): boolean {
  return ["dispatched", "in_transit"].includes(status);
}

/**
 * Check if status is completed successfully
 */
export function isStatusCompleted(status: string): boolean {
  return status === "completed";
}

/**
 * Check if status is failed
 */
export function isStatusFailed(status: string): boolean {
  return ["failed", "cancelled"].includes(status);
}
