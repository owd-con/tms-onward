/**
 * Status utilities for TMS Onward Admin
 * Converts snake_case API status values to Title Case for display
 */

/**
 * Convert snake_case status to Title Case for display
 * @example formatStatus("in_transit") => "In Transit"
 */
export function formatStatus(status: string): string {
  return status.split("_").map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(" ");
}

/**
 * Get Tailwind color classes for status badges
 * @example getStatusColor("in_transit") => "bg-blue-100 text-blue-700 border-blue-200"
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: "bg-slate-100 text-slate-700 border-slate-200",
    planned: "bg-slate-100 text-slate-700 border-slate-200",
    dispatched: "bg-yellow-100 text-yellow-700 border-yellow-200",
    in_transit: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    cancelled: "bg-gray-100 text-gray-700 border-gray-200",
    returned: "bg-orange-100 text-orange-700 border-orange-200",
  };
  return colorMap[status] || colorMap.pending;
}

/**
 * Get DaisyUI badge variant for status
 * @example getStatusVariant("in_transit") => "info"
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
    returned: "warning",
  };
  return statusMap[status] || "primary";
}
