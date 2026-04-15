/**
 * TMS Onward - Entity Type Definitions
 *
 * Type definitions for TMS domain entities based on backend Go entities.
 * Reference: backend/entity/*.go
 */

// ============================================================================
// User & Authentication
// ============================================================================

export interface User {
  id: string;
  company_id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  language?: string;
  role: UserRole;
  usergroup?: UserGroup;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  is_deleted: boolean;
  company?: Company;
}

export interface UserGroup {
  id: string;
  name: string;
  permissions: string[];
}

export type UserRole = "admin" | "dispatcher" | "driver";

export interface Company {
  id: string;
  company_name: string;
  brand_name?: string;
  type: CompanyType;
  phone?: string;
  address?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  logo_url?: string;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export type CompanyType = "3pl" | "carrier" | "inhouse";

export interface SessionClaims {
  user_id: string;
  company_id: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
}

// ============================================================================
// Master Data - Customer
// ============================================================================

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  is_deleted: boolean;
}

// ============================================================================
// Master Data - Vehicle
// ============================================================================

export interface Vehicle {
  id: string;
  company_id: string;
  plate_number: string;
  type: string;
  capacity_weight?: number; // kg
  capacity_volume?: number; // m3
  year?: number;
  make?: string;
  model?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  is_deleted: boolean;
}

// ============================================================================
// Master Data - Driver
// ============================================================================

export interface Driver {
  id: string;
  company_id: string;
  user_id?: string;
  name: string;
  license_number: string;
  license_type?: string;
  license_expiry?: string; // YYYY-MM-DD
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  is_deleted: boolean;
}

// ============================================================================
// Master Data - Address & Geo
// ============================================================================

export interface Address {
  id: string;
  company_id?: string;      // For inhouse company
  customer_id?: string;    // For 3pl/carrier company
  name: string;
  address: string;
  region_id: string; // Reference to region-id library's Region entity
  contact_name?: string;
  contact_phone?: string;
  type?: "pickup_point" | "drop_point";  // For inhouse company
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  is_deleted: boolean;
  region?: Region; // Region relation from region-id library
}

// ============================================================================
// Master Data - Region (from region-id library)
// ============================================================================

// Region types matching region-id library (v0.1.3)
// Note: Library uses "regency" instead of "city", and 4 levels (1-4) instead of 5
export type RegionType = "province" | "regency" | "district" | "village";

// AdministrativeArea contains hierarchical region information for display
// This is stored as JSONB in the database and contains full names of each level
export interface AdministrativeArea {
  country?: string;
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  country_id?: string;
  province_id?: string;
  regency_id?: string;
  district_id?: string;
  village_id?: string;
}

export interface Region {
  id: string;
  parent_id?: string;
  code: string;
  name: string;
  type: RegionType;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  level: number; // 1=province, 2=regency, 3=district, 4=village (region-id library)
  administrative_area: AdministrativeArea; // JSONB with full hierarchy names
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  parent?: Region;
  children?: Region[];
  // Computed properties (may be populated by backend or frontend)
  full_name?: string; // "Village, District, Regency, Province, Country"
  path?: string; // "Province, Regency, District, Village" (for backward compatibility)
}

// Computed property helpers (not from backend, derived in frontend)
export interface RegionWithExtras extends Region {
  // Full hierarchical name computed from administrative_area
  full_name?: string; // "Village, District, Regency, Province, Country"
  // Path computed from administrative_area
  path?: string; // "Province, Regency, District, Village" (for backward compatibility)
}

export interface RegionPath {
  id: string;
  name: string;
  type: RegionType;
  code: string;
  level: number;
}

// Region search result for API responses (matches region-id library output)
export interface RegionSearchResult {
  id: string;
  code: string;
  name: string;
  type: RegionType;
  administrative_area: any; // Full hierarchy from backend
  latitude?: number;
  longitude?: number;
  postal_code?: string;
  parent_id?: string;
  level: number;
}

// ============================================================================
// Master Data - Pricing Matrix
// ============================================================================

export interface PricingMatrix {
  id: string;
  company_id: string;
  customer_id?: string; // NULL untuk default pricing
  origin_city_id: string;
  destination_city_id: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  is_deleted: boolean;
  customer?: Customer;
  origin_region?: Region;
  destination_region?: Region;
}

// ============================================================================
// Order Management
// ============================================================================

export interface Order {
  id: string;
  company_id: string;
  order_number: string;
  customer_id: string;
  order_type: OrderType;
  reference_code?: string;
  special_instructions?: string;
  status: OrderStatus;
  total_price: number;
  manual_override_price?: number; // FTL only
  total_shipment?: number; // Total number of shipments in this order
  total_delivered?: number; // Number of delivered shipments (for progress tracking)
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  customer?: Customer;
  order_waypoints?: OrderWaypoint[]; // DEPRECATED - use shipments instead
  shipments?: Shipment[]; // v2.11 - Shipment concept
  trip?: Trip; // v2.10 - Associated trip (if order is dispatched)
  failed_shipments?: FailedShipment[]; // For exception reschedule
}

// Failed shipment for exception handling
export interface FailedShipment {
  id: string;
  shipment_number: string;
  sorting_id?: number;
  origin_location_name?: string;
  origin_address?: string;
  dest_location_name?: string;
  dest_location?: string;
  dest_address?: string;
  failed_reason?: string;
}

export type OrderType = "FTL" | "LTL";

export type OrderStatus =
  | "pending"
  | "planned"
  | "dispatched"
  | "in_transit"
  | "completed"
  | "cancelled"
  | "returned";

export interface OrderWaypoint {
  id: string;
  order_id: string;
  type: WaypointType;
  address_id?: string;
  location_name?: string;
  location_address?: string;
  contact_name?: string;
  contact_phone?: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string; // HH:mm
  price?: number; // Delivery only
  weight?: number; // kg, auto-calculated from items
  items?: WaypointItem[];
  dispatch_status: WaypointStatus;
  sequence_number?: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  address?: Address;
  pods?: POD;
  waypoint_logs?: WaypointLog[];
}

export type WaypointType = "pickup" | "delivery";

export type WaypointStatus =
  | "pending"
  | "dispatched"
  | "in_transit"
  | "completed"
  | "failed"
  | "returned";

export interface WaypointItem {
  name: string;
  quantity: number;
  weight?: number; // kg
  volume?: number; // m3
}

// ============================================================================
// Shipment Management (v2.11) - Shipment Concept
// ============================================================================

export interface Shipment {
  id: string;
  order_id: string;
  company_id: string;
  shipment_number: string;
  sorting_id: number; // sequence within order
  // Route
  origin_address_id: string;
  destination_address_id: string;
  // Snapshot address (for historical accuracy)
  origin_location_name: string;
  origin_address: string;
  origin_contact_name: string;
  origin_contact_phone: string;
  dest_location_name: string;
  dest_address: string;
  dest_contact_name: string;
  dest_contact_phone: string;
  // Items
  items: ShipmentItem[];
  total_weight: number;
  volume: number;
  // Pricing
  price: number;
  // Schedule
  scheduled_pickup_date: string; // YYYY-MM-DD
  scheduled_pickup_time?: string; // HH:mm
  scheduled_delivery_date: string; // YYYY-MM-DD
  scheduled_delivery_time?: string; // HH:mm
  // Status tracking
  status: ShipmentStatus;
  // Execution data
  actual_pickup_time?: string;
  actual_delivery_time?: string;
  received_by?: string;
  delivery_notes?: string;
  // Failed/Cancelled tracking
  failed_reason?: string;
  failed_at?: string;
  retry_count: number;
  // Return tracking
  returned_note?: string;
  returned_at?: string;
  // Audit
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  // Relations
  origin_address_rel?: Address;
  destination_address_rel?: Address;
}

export type ShipmentStatus =
  | "pending"
  | "dispatched"
  | "on_pickup"
  | "picked_up"
  | "on_delivery"
  | "delivered"
  | "failed"
  | "returned"
  | "cancelled";

export interface ShipmentItem {
  name: string;
  sku: string;
  quantity: number;
  weight: number;
  price: number;
}

// ============================================================================
// Preview Trip Waypoint
// ============================================================================

/**
 * Preview of trip waypoint before trip creation
 * Used for displaying what waypoints will be created from shipments
 */
export interface PreviewTripWaypoint {
  type: "pickup" | "delivery";
  address_id: string;
  location_name: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  sequence_number: number;
  shipment_ids: string[];
  shipment_count: number;
}

// ============================================================================
// Waypoint Images (v2.10) - POD & Failed Evidence
// ============================================================================

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

// ============================================================================
// POD (Proof of Delivery) - DEPRECATED v2.10
// ============================================================================

/** @deprecated Use WaypointImage instead */
export interface POD {
  id: string;
  order_waypoint_id: string;
  signature_url: string;
  photos: string[]; // array of photo URLs
  notes?: string;
  submitted_at: string;
  submitted_by?: string;
}

// ============================================================================
// Waypoint Logs (Audit Trail) - Updated v2.10
// ============================================================================

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

// ============================================================================
// Trip Management
// ============================================================================

export interface Trip {
  id: string;
  company_id: string;
  order_id: string;
  trip_number: string;
  driver_id: string;
  vehicle_id: string;
  status: TripStatus;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  driver?: Driver;
  vehicle?: Vehicle;
  order?: Order;
  dispatch?: Dispatch;
  trip_waypoints?: TripWaypoint[];
  total_waypoints?: number;
  total_completed?: number;
}

export type TripStatus =
  | "planned"
  | "dispatched"
  | "in_transit"
  | "completed"
  | "cancelled";

export interface Dispatch {
  id: string;
  trip_id: string;
  order_id: string;
  status: DispatchStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  dispatch_waypoints?: DispatchWaypoint[];
}

export type DispatchStatus = "planned" | "dispatched" | "completed";

export interface DispatchWaypoint {
  id: string;
  dispatch_id: string;
  order_waypoint_id: string;
  sequence_number: number;
  status: DispatchWaypointStatus;
  actual_arrival_time?: string;
  actual_completion_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export type DispatchWaypointStatus =
  | "pending"
  | "dispatched"
  | "in_transit"
  | "completed"
  | "failed";

export interface TripWaypoint {
  id: string;
  trip_id: string;
  shipment_ids: string[]; // Array of shipment IDs handled by this waypoint
  sequence_number: number;
  type: "pickup" | "delivery"; // Waypoint type
  status: TripWaypointStatus;
  arrived_at?: string;
  completed_at?: string;
  actual_arrival_time?: string;
  actual_completion_time?: string;
  notes?: string;
  received_by?: string; // Nama penerima (delivery completed)
  failed_reason?: string; // Alasan gagal (waypoint failed)
  // Location info (direct fields, no longer nested order_waypoint)
  address_id?: string;
  location_name?: string;
  address?: string;
  contact_name?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  // Shipment details populated by backend (if included in response)
  shipments?: Shipment[];
}

export type TripWaypointStatus =
  | "pending"
  | "dispatched"
  | "in_transit"
  | "completed"
  | "failed";

// ============================================================================
// Dashboard Stats
// ============================================================================

export interface DashboardStats {
  total_orders: number;
  active_trips: number;
  active_orders: number;
  pending_orders: number;
  completed_orders: number;
}

export interface MapShipment {
  shipment_id: string;
  shipment_number: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  origin_address: string;
  origin_city: string;
  origin_lat: number;
  origin_lng: number;
  dest_address: string;
  dest_city: string;
  dest_lat: number;
  dest_lng: number;
  status: string;
}

export interface MapShipmentsByArea {
  origin_address: string;
  origin_city: string;
  origin_lat: number;
  origin_lng: number;
  shipments: MapShipment[];
}

export interface ExpiredVehicle {
  id: string;
  plate_number: string;
  expired_year: number;
  brand: string;
  model: string;
}

export interface ExpiredDriver {
  id: string;
  name: string;
  license_type: string;
  license_expiry: string;
  phone_number: string;
}

export interface FailedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  failed_shipments_count: number;
  failed_reason: string;
  status: string;
  failed_at?: string;
}

export interface CapacityUtilization {
  ftl_utilization_percent: number;
  ltl_utilization_percent: number;
}

export interface OnTimeDeliveryRate {
  on_time_count: number;
  late_count: number;
  total_delivered: number;
  on_time_rate_percent: number;
}

export interface DashboardActiveTrip {
  trip_id: string;
  trip_number: string;
  driver_name: string;
  driver_phone: string;
  vehicle_plate: string;
  vehicle_type: string;
  status: string;
  started_at: string | null;
  total_waypoints: number;
  completed_waypoints: number;
}

export interface DashboardOrderTrip {
  order_id: string;
  order_number: string;
  order_type: string;
  customer_name: string;
  status: string;
  created_at: string;
  trip_number?: string;
  driver_name?: string;
  vehicle_plate?: string;
  total_shipment?: number;
  total_delivered?: number;
}

export interface Dashboard {
  stats: DashboardStats;
  shipments_by_type?: {
    type: string;
    count: number;
    percent: number;
  }[];
  top_customers?: {
    customer_id: string;
    customer_name: string;
    total_count: number;
  }[];
  on_time_delivery_rate: OnTimeDeliveryRate;
  active_trips: DashboardActiveTrip[];
  active_orders: DashboardOrderTrip[];
  map_shipments_by_area: MapShipmentsByArea[];
  expired_vehicles: ExpiredVehicle[];
  expired_drivers: ExpiredDriver[];
  failed_orders: FailedOrder[];
}

// ============================================================================
// Warehouse Management (Location Layout)
// ============================================================================

export interface LocationLayout {
  name: string;
  coordinate_x: number;
  coordinate_y: number;
  width: number;
  height: number;
  orientation: "horizontal" | "vertical";
  fill?: string;
  qty_available?: number;
  qty_allocated?: number;
  locations?: LocationLayout[];
}

// ============================================================================
// Exception Management
// ============================================================================

export interface WaypointFailure {
  id: string;
  order_waypoint_id: string;
  order_id: string;
  order_number: string;
  order: Order;
  waypoint: OrderWaypoint;
  trip_id?: string;
  trip_number?: string;
  trip?: Trip;
  driver_id?: string;
  driver?: Driver;
  failure_reason: string;
  failure_notes?: string;
  failed_at: string;
  reschedule_status: RescheduleStatus;
  rescheduled_at?: string;
  rescheduled_trip_id?: string;
  created_at: string;
  updated_at: string;
}

export type RescheduleStatus =
  | "failed"
  | "pending_reschedule"
  | "rescheduled"
  | "cancelled";

// ============================================================================

// ============================================================================
// Report Types
// ============================================================================

export interface OrderSummaryReport {
  total_orders: number;
  orders_by_status: Record<string, number>;
  orders_by_type: Record<string, number>;
}

export interface TripSummaryReport {
  total_trips: number;
  trips_by_status: Record<string, number>;
}

export interface RevenueReport {
  total_revenue: number;
}

export interface ExceptionReport {
  total_exceptions: number;
  exceptions_by_type: Record<string, number>;
}

export interface DriverPerformanceReport {
  driver_id: string;
  driver_name: string;
  total_trips: number;
  completed_trips: number;
  on_time_rate: number;
}
