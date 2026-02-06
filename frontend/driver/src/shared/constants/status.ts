/**
 * Status constants for TMS Onward Driver App
 * References backend entity values from:
 * - entity/trip.go
 * - entity/order.go
 * - entity/order_waypoint.go
 * - entity/trip_waypoint.go
 */

// ============================================================================
// TRIP STATUS
// ============================================================================

/**
 * Trip status values from backend (snake_case)
 * Default: 'planned'
 * Transitions: planned -> dispatched -> in_transit -> completed
 *              any -> cancelled
 */
export const TRIP_STATUS = {
  PLANNED: 'planned',
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TripStatus = (typeof TRIP_STATUS)[keyof typeof TRIP_STATUS];

/**
 * Human-readable labels for trip statuses
 */
export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  [TRIP_STATUS.PLANNED]: 'Direncanakan',
  [TRIP_STATUS.DISPATCHED]: 'Dikirim',
  [TRIP_STATUS.IN_TRANSIT]: 'Dalam Perjalanan',
  [TRIP_STATUS.COMPLETED]: 'Selesai',
  [TRIP_STATUS.CANCELLED]: 'Dibatalkan',
};

/**
 * Badge configurations for trip statuses
 */
export const TRIP_STATUS_BADGES: Record<
  TripStatus,
  { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'; icon?: string }
> = {
  [TRIP_STATUS.PLANNED]: { variant: 'info', icon: 'clipboard' },
  [TRIP_STATUS.DISPATCHED]: { variant: 'primary', icon: 'truck' },
  [TRIP_STATUS.IN_TRANSIT]: { variant: 'warning', icon: 'truck' },
  [TRIP_STATUS.COMPLETED]: { variant: 'success', icon: 'check-circle' },
  [TRIP_STATUS.CANCELLED]: { variant: 'danger' },
};

/**
 * Get trip status badge configuration
 */
export function getTripStatusBadge(status: string): {
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
  label: string;
} {
  const normalizedStatus = normalizeStatus(status, Object.values(TRIP_STATUS));
  return {
    ...TRIP_STATUS_BADGES[normalizedStatus as TripStatus],
    label: TRIP_STATUS_LABELS[normalizedStatus as TripStatus] || status,
  };
}

// ============================================================================
// WAYPOINT STATUS
// ============================================================================

/**
 * TripWaypoint status values from backend (snake_case)
 * Default: 'pending'
 * Transitions: pending -> in_transit -> completed
 *              pending -> failed
 *              in_transit -> failed
 */
export const WAYPOINT_STATUS = {
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
} as const;

export type WaypointStatus = (typeof WAYPOINT_STATUS)[keyof typeof WAYPOINT_STATUS];

/**
 * Human-readable labels for waypoint statuses
 */
export const WAYPOINT_STATUS_LABELS: Record<WaypointStatus, string> = {
  [WAYPOINT_STATUS.PENDING]: 'Tertunda',
  [WAYPOINT_STATUS.IN_TRANSIT]: 'Dalam Perjalanan',
  [WAYPOINT_STATUS.COMPLETED]: 'Selesai',
  [WAYPOINT_STATUS.FAILED]: 'Gagal',
  [WAYPOINT_STATUS.RETURNED]: 'Dikembalikan',
  [WAYPOINT_STATUS.CANCELLED]: 'Dibatalkan',
};

/**
 * Badge configurations for waypoint statuses
 */
export const WAYPOINT_STATUS_BADGES: Record<
  WaypointStatus,
  { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'; icon?: string }
> = {
  [WAYPOINT_STATUS.PENDING]: { variant: 'default' },
  [WAYPOINT_STATUS.IN_TRANSIT]: { variant: 'warning', icon: 'truck' },
  [WAYPOINT_STATUS.COMPLETED]: { variant: 'success', icon: 'check-circle' },
  [WAYPOINT_STATUS.FAILED]: { variant: 'danger' },
  [WAYPOINT_STATUS.RETURNED]: { variant: 'danger' },
  [WAYPOINT_STATUS.CANCELLED]: { variant: 'default' },
};

/**
 * Get waypoint status badge configuration
 */
export function getWaypointStatusBadge(status: string): {
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
  label: string;
} {
  const normalizedStatus = normalizeStatus(status, Object.values(WAYPOINT_STATUS));
  return {
    ...WAYPOINT_STATUS_BADGES[normalizedStatus as WaypointStatus],
    label: WAYPOINT_STATUS_LABELS[normalizedStatus as WaypointStatus] || status,
  };
}

// ============================================================================
// DISPATCH STATUS (OrderWaypoint.DispatchStatus)
// ============================================================================

/**
 * Dispatch status values for OrderWaypoint from backend (snake_case)
 * Default: 'pending'
 * This is the same as WAYPOINT_STATUS but used in different context
 */
export const DISPATCH_STATUS = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETURNED: 'returned',
} as const;

export type DispatchStatus = (typeof DISPATCH_STATUS)[keyof typeof DISPATCH_STATUS];

/**
 * Human-readable labels for dispatch statuses
 */
export const DISPATCH_STATUS_LABELS: Record<DispatchStatus, string> = {
  [DISPATCH_STATUS.PENDING]: 'Tertunda',
  [DISPATCH_STATUS.DISPATCHED]: 'Dikirim',
  [DISPATCH_STATUS.IN_TRANSIT]: 'Dalam Perjalanan',
  [DISPATCH_STATUS.COMPLETED]: 'Selesai',
  [DISPATCH_STATUS.FAILED]: 'Gagal',
  [DISPATCH_STATUS.RETURNED]: 'Dikembalikan',
};

/**
 * Get dispatch status label
 */
export function getDispatchStatusLabel(status: string): string {
  const normalizedStatus = normalizeStatus(status, Object.values(DISPATCH_STATUS));
  return DISPATCH_STATUS_LABELS[normalizedStatus as DispatchStatus] || status;
}

// ============================================================================
// ORDER STATUS
// ============================================================================

/**
 * Order status values from backend (snake_case)
 * Default: 'pending'
 * Transitions: pending -> planned -> dispatched -> in_transit -> completed
 *              any -> cancelled
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  PLANNED: 'planned',
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/**
 * Human-readable labels for order statuses
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: 'Tertunda',
  [ORDER_STATUS.PLANNED]: 'Direncanakan',
  [ORDER_STATUS.DISPATCHED]: 'Dikirim',
  [ORDER_STATUS.IN_TRANSIT]: 'Dalam Perjalanan',
  [ORDER_STATUS.COMPLETED]: 'Selesai',
  [ORDER_STATUS.CANCELLED]: 'Dibatalkan',
};

/**
 * Get order status label
 */
export function getOrderStatusLabel(status: string): string {
  const normalizedStatus = normalizeStatus(status, Object.values(ORDER_STATUS));
  return ORDER_STATUS_LABELS[normalizedStatus as OrderStatus] || status;
}

// ============================================================================
// WAYPOINT TYPE
// ============================================================================

/**
 * Waypoint type values from OrderWaypoint entity
 */
export const WAYPOINT_TYPE = {
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
} as const;

export type WaypointType = (typeof WAYPOINT_TYPE)[keyof typeof WAYPOINT_TYPE];

/**
 * Human-readable labels for waypoint types
 */
export const WAYPOINT_TYPE_LABELS: Record<WaypointType, string> = {
  [WAYPOINT_TYPE.PICKUP]: 'Penjemputan',
  [WAYPOINT_TYPE.DELIVERY]: 'Pengantaran',
};

/**
 * Get waypoint type label
 */
export function getWaypointTypeLabel(type: string): string {
  const normalizedType = normalizeStatus(type, Object.values(WAYPOINT_TYPE));
  return WAYPOINT_TYPE_LABELS[normalizedType as WaypointType] || type;
}

// ============================================================================
// ORDER TYPE
// ============================================================================

/**
 * Order type values from Order entity
 */
export const ORDER_TYPE = {
  FTL: 'FTL', // Full Truck Load
  LTL: 'LTL', // Less Than Truck Load
} as const;

export type OrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE];

/**
 * Human-readable labels for order types
 */
export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  [ORDER_TYPE.FTL]: 'Full Truck Load',
  [ORDER_TYPE.LTL]: 'Less Than Truck Load',
};

/**
 * Get order type label
 */
export function getOrderTypeLabel(type: string): string {
  const normalizedType = normalizeStatus(type, Object.values(ORDER_TYPE));
  return ORDER_TYPE_LABELS[normalizedType as OrderType] || type;
}

// ============================================================================
// ISSUE TYPE (for exception reporting)
// ============================================================================

/**
 * Issue types for reporting exceptions
 * Based on waypoint issue handling in backend
 */
export const ISSUE_TYPE = {
  FAILED_PICKUP: 'failed_pickup',
  FAILED_DELIVERY: 'failed_delivery',
  RETURN_TO_ORIGIN: 'return_to_origin',
  DELAY: 'delay',
  BREAKDOWN: 'breakdown',
} as const;

export type IssueType = (typeof ISSUE_TYPE)[keyof typeof ISSUE_TYPE];

/**
 * Human-readable labels for issue types
 */
export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  [ISSUE_TYPE.FAILED_PICKUP]: 'Gagal Jemput',
  [ISSUE_TYPE.FAILED_DELIVERY]: 'Gagal Antar',
  [ISSUE_TYPE.RETURN_TO_ORIGIN]: 'Kembali ke Asal',
  [ISSUE_TYPE.DELAY]: 'Keterlambatan',
  [ISSUE_TYPE.BREAKDOWN]: 'Kerusakan Kendaraan',
};

/**
 * Get issue type label
 */
export function getIssueTypeLabel(type: string): string {
  return ISSUE_TYPE_LABELS[type as IssueType] || type;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize status string to match enum values
 * Handles case variations and extra spaces
 */
function normalizeStatus(status: string, validValues: readonly string[]): string {
  const trimmed = status.trim();
  const matched = validValues.find((v) => v.toLowerCase() === trimmed.toLowerCase());
  return matched || trimmed;
}

/**
 * Check if trip status allows starting
 */
export function canStartTrip(status: string): boolean {
  return status === TRIP_STATUS.DISPATCHED;
}

/**
 * Check if trip status allows completing
 */
export function canCompleteTrip(status: string): boolean {
  return status === TRIP_STATUS.IN_TRANSIT;
}

/**
 * Check if trip can be cancelled
 */
export function canCancelTrip(status: string): boolean {
  const normalizedStatus = normalizeStatus(status, Object.values(TRIP_STATUS));
  const cancelNotAllowed: TripStatus[] = [TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED];
  return !cancelNotAllowed.includes(normalizedStatus as TripStatus);
}

/**
 * Check if waypoint status allows updating
 */
export function canUpdateWaypoint(status: string): boolean {
  return status !== WAYPOINT_STATUS.COMPLETED;
}

/**
 * Check if waypoint allows POD submission
 */
export function canSubmitPOD(status: string, waypointType: string): boolean {
  const normalizedStatus = normalizeStatus(status, Object.values(WAYPOINT_STATUS));
  const podAllowedStatuses: WaypointStatus[] = [WAYPOINT_STATUS.IN_TRANSIT, WAYPOINT_STATUS.COMPLETED];
  return (
    waypointType === WAYPOINT_TYPE.DELIVERY &&
    podAllowedStatuses.includes(normalizedStatus as WaypointStatus)
  );
}

/**
 * Check if status is a failure/return state
 */
export function isFailureStatus(status: string): boolean {
  const normalizedStatus = normalizeStatus(status, Object.values(WAYPOINT_STATUS));
  const failureStatuses: WaypointStatus[] = [WAYPOINT_STATUS.FAILED, WAYPOINT_STATUS.RETURNED];
  return failureStatuses.includes(normalizedStatus as WaypointStatus);
}
