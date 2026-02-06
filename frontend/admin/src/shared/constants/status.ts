/**
 * Status constants and badge color mappings for TMS Onward
 *
 * This file contains all status-related constants for Order, Trip, and Waypoint entities,
 * along with their label mappings (Indonesian) and badge color classes for DaisyUI/Tailwind.
 */

// ============================================================================
// ORDER STATUS CONSTANTS
// ============================================================================

/**
 * All possible order status values
 */
export const ORDER_STATUS = [
  'Pending',
  'Planned',
  'Dispatched',
  'In Transit',
  'Completed',
  'Cancelled',
  'Returned',
] as const;

/**
 * Order status type definition
 */
export type OrderStatus = (typeof ORDER_STATUS)[number];

/**
 * Order status labels in Indonesian
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  Pending: 'Menunggu',
  Planned: 'Terjadwal',
  Dispatched: 'Dikirim',
  'In Transit': 'Dalam Perjalanan',
  Completed: 'Selesai',
  Cancelled: 'Dibatalkan',
  Returned: 'Dikembalikan',
};

/**
 * Order status badge color mappings (DaisyUI/Tailwind classes)
 */
export const ORDER_STATUS_BADGES: Record<OrderStatus, string> = {
  Pending: 'badge-warning',
  Planned: 'badge-info',
  Dispatched: 'badge-primary',
  'In Transit': 'badge-info',
  Completed: 'badge-success',
  Cancelled: 'badge-error',
  Returned: 'badge-neutral',
};

// ============================================================================
// TRIP STATUS CONSTANTS
// ============================================================================

/**
 * All possible trip status values
 */
export const TRIP_STATUS = [
  'Planned',
  'Dispatched',
  'In Transit',
  'Completed',
  'Cancelled',
] as const;

/**
 * Trip status type definition
 */
export type TripStatus = (typeof TRIP_STATUS)[number];

/**
 * Trip status labels in Indonesian
 */
export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  Planned: 'Terjadwal',
  Dispatched: 'Dikirim',
  'In Transit': 'Dalam Perjalanan',
  Completed: 'Selesai',
  Cancelled: 'Dibatalkan',
};

/**
 * Trip status badge color mappings (DaisyUI/Tailwind classes)
 */
export const TRIP_STATUS_BADGES: Record<TripStatus, string> = {
  Planned: 'badge-info',
  Dispatched: 'badge-primary',
  'In Transit': 'badge-info',
  Completed: 'badge-success',
  Cancelled: 'badge-error',
};

// ============================================================================
// WAYPOINT STATUS CONSTANTS
// ============================================================================

/**
 * All possible waypoint status values
 */
export const WAYPOINT_STATUS = [
  'Pending',
  'Dispatched',
  'In Transit',
  'Completed',
  'Failed',
  'Returned',
] as const;

/**
 * Waypoint status type definition
 */
export type WaypointStatus = (typeof WAYPOINT_STATUS)[number];

/**
 * Waypoint status labels in Indonesian
 */
export const WAYPOINT_STATUS_LABELS: Record<WaypointStatus, string> = {
  Pending: 'Menunggu',
  Dispatched: 'Dikirim',
  'In Transit': 'Dalam Perjalanan',
  Completed: 'Selesai',
  Failed: 'Gagal',
  Returned: 'Dikembalikan',
};

/**
 * Waypoint status badge color mappings (DaisyUI/Tailwind classes)
 */
export const WAYPOINT_STATUS_BADGES: Record<WaypointStatus, string> = {
  Pending: 'badge-warning',
  Dispatched: 'badge-primary',
  'In Transit': 'badge-info',
  Completed: 'badge-success',
  Failed: 'badge-error',
  Returned: 'badge-neutral',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get Indonesian label for an order status
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] || status;
}

/**
 * Get badge class for an order status
 */
export function getOrderStatusBadge(status: OrderStatus): string {
  return ORDER_STATUS_BADGES[status] || 'badge-neutral';
}

/**
 * Get Indonesian label for a trip status
 */
export function getTripStatusLabel(status: TripStatus): string {
  return TRIP_STATUS_LABELS[status] || status;
}

/**
 * Get badge class for a trip status
 */
export function getTripStatusBadge(status: TripStatus): string {
  return TRIP_STATUS_BADGES[status] || 'badge-neutral';
}

/**
 * Get Indonesian label for a waypoint status
 */
export function getWaypointStatusLabel(status: WaypointStatus): string {
  return WAYPOINT_STATUS_LABELS[status] || status;
}

/**
 * Get badge class for a waypoint status
 */
export function getWaypointStatusBadge(status: WaypointStatus): string {
  return WAYPOINT_STATUS_BADGES[status] || 'badge-neutral';
}
