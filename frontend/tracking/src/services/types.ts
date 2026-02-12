/**
 * TMS Onward - Public Tracking Type Definitions
 *
 * Type definitions for public order tracking (minimal, specific to tracking page)
 */

// ============================================================================
// Waypoint History (for timeline display)
// ============================================================================

export interface WaypointHistory {
  waypoint_id: string;
  location_name: string;
  address: string;
  type: string; // pickup or delivery
  status: string;
  old_status?: string;
  notes?: string;
  changed_at: string;
}

// ============================================================================
// Waypoint Images (POD & Failed Evidence)
// ============================================================================

export interface WaypointImageInfo {
  waypoint_image_id: string;
  type: "pod" | "failed";
  note?: string;
  photos?: string[];
  signature_url?: string;
  submitted_at: string;
}
