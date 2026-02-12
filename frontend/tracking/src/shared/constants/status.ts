/**
 * Status constants for the tracking application
 *
 * Centralized definitions of all status values used throughout the application
 * for orders, waypoints, trips, and waypoint types.
 */

// Order Status
export const ORDER_STATUS = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Waypoint Status
export const WAYPOINT_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  SKIPPED: 'Skipped',
} as const;

export type WaypointStatus = typeof WAYPOINT_STATUS[keyof typeof WAYPOINT_STATUS];

// Trip Status
export const TRIP_STATUS = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export type TripStatus = typeof TRIP_STATUS[keyof typeof TRIP_STATUS];

// Waypoint Type
export const WAYPOINT_TYPE = {
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
} as const;

export type WaypointType = typeof WAYPOINT_TYPE[keyof typeof WAYPOINT_TYPE];

// Status arrays for validation/iteration
export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS) as readonly OrderStatus[];
export const WAYPOINT_STATUS_VALUES = Object.values(WAYPOINT_STATUS) as readonly WaypointStatus[];
export const TRIP_STATUS_VALUES = Object.values(TRIP_STATUS) as readonly TripStatus[];
export const WAYPOINT_TYPE_VALUES = Object.values(WAYPOINT_TYPE) as readonly WaypointType[];
