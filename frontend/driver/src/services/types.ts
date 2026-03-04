// ============================================
// TMS Driver - Common Types
// ============================================

/**
 * TMS Company Entity
 */
export interface Company {
  id: string;
  name: string;
  type: string;
  timezone: string;
  currency: string;
  language: string;
  logo_url?: string;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * TMS User Entity
 */
export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  language: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  company?: Company;
}

// ============================================
// Domain Types - Driver & Operations
// ============================================

/**
 * Trip Entity
 */
export interface Trip {
  id: string;
  company_id: string;
  order_id: string;
  trip_number: string;
  driver_id: string;
  vehicle_id: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;

  company?: Company;
  driver?: Driver;
  vehicle?: Vehicle;
  order?: Order;
  trip_waypoints?: TripWaypoint[];
}

/**
 * Order Entity (Summary)
 */
export interface Order {
  id: string;
  company_id: string;
  order_number: string;
  status: string;
  customer_id: string;
  customer: any;
}

/**
 * Shipment Item Entity
 */
export interface ShipmentItem {
  name: string;
  sku: string;
  quantity: number;
  weight: number;
  price: number;
}

/**
 * Driver Shipment Entity (for driver app)
 * Simplified shipment data for driver display
 */
export interface DriverShipment {
  id: string;
  shipment_number: string;
  sorting_id: number;
  origin_location_name: string;
  origin_address: string;
  dest_location_name: string;
  dest_address: string;
  items: ShipmentItem[];
  total_weight: number;
  status: string;
}

/**
 * Trip Waypoint Entity (v2.10) - Updated with shipments
 */
export interface TripWaypoint {
  id: string;
  trip_id: string;
  shipment_ids: string[];
  sequence_number: number;
  type: string; // "pickup" | "delivery"
  address_id: string;
  location_name: string;
  address: string;
  contact_name?: string;
  contact_phone?: string;
  status: string;
  actual_arrival_time?: string;
  actual_completion_time?: string;
  notes?: string;
  received_by?: string; // v2.10 - Nama penerima (delivery completed)
  loaded_by?: string; // v2.10 - Nama staff warehouse (pickup loading completed)
  failed_reason?: string; // v2.10 - Alasan gagal (waypoint failed)
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;

  trip?: Trip;
  address_rel?: any; // Address relation
  shipments?: DriverShipment[]; // Shipments at this waypoint
}

/**
 * Order Waypoint Entity (Legacy - kept for backward compatibility)
 * @deprecated Use shipments instead
 */
export interface OrderWaypoint {
  id: string;
  order_id: string;
  type: string; // "pickup" | "delivery"
  sequence_number: number;
  status: string;
  dispatch_status: string;
  address_id: string;
  location_name: string;
  location_address: string;
  contact_name: string;
  contact_phone: string;
  scheduled_date: string;
  scheduled_time?: string;
  special_instructions?: string;
  price?: number;
  weight?: number;
  items?: OrderWaypointItem[];
  order?: Order;
  created_at: string;
  updated_at: string;
}

/**
 * Order Waypoint Item (Legacy)
 * @deprecated Use ShipmentItem instead
 */
export interface OrderWaypointItem {
  name: string;
  quantity: number;
  weight?: number;
}

/**
 * Driver Entity
 */
export interface Driver {
  id: string;
  user_id: string;
  license_number: string;
  license_type: string;
  license_expiry_date: string;
  status: string;
}

/**
 * Vehicle Entity
 */
export interface Vehicle {
  id: string;
  company_id: string;
  plate_number: string;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  capacity_volume: number;
  capacity_weight: number;
  status: string;
}

// ============================================
// Waypoint Images (v2.10) - POD & Failed Evidence
// ============================================

/**
 * Waypoint Image Entity (v2.10)
 * Untuk menyimpan bukti POD (proof of delivery) dan failed delivery evidence
 */
export interface WaypointImage {
  id: string;
  trip_waypoint_id: string;
  type: "pod" | "failed"; // 'pod' = proof of delivery, 'failed' = failed delivery evidence
  signature_url?: string; // untuk type='pod'
  images: string[]; // array of photo URLs
  note?: string;
  created_at: string;
  created_by?: string;
  is_deleted?: boolean;
  // Related waypoint (included by backend)
  trip_waypoint?: TripWaypoint;
}

// ============================================
// Waypoint Logs (Audit Trail) - v2.10
// ============================================

/**
 * Waypoint Log Entity (v2.10)
 * Untuk tracking history dan audit trail
 */
export interface WaypointLog {
  id: string;
  order_id?: string;
  trip_waypoint_id?: string;
  order_waypoint_id?: string;
  event_type?: string; // 'order_created', 'waypoint_started', 'waypoint_arrived', 'waypoint_completed', 'waypoint_failed'
  message?: string; // Human-readable message in Indonesian
  old_status?: string;
  new_status?: string;
  metadata?: any; // JSONB - additional data (e.g., received_by, failed_reason)
  created_at: string;
  created_by?: string;
}
