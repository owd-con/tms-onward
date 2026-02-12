import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Report API
 *
 * Provides API endpoints for report operations.
 * Reference: backend/src/handler/rest/report/handler.go
 */

export const reportApi = createApi({
  reducerPath: "reportApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /reports/order-trip-waypoint
     * Get comprehensive order, trip, and waypoint report
     *
     * Query params:
     * - start_date: string (YYYY-MM-DD)
     * - end_date: string (YYYY-MM-DD)
     * - customer_id: string (optional)
     * - driver_id: string (optional)
     * - status: string (optional)
     * - downloadable: boolean (optional) - triggers Excel download
     * - page: number (optional)
     * - limit: number (optional)
     */
    getOrderTripWaypointReport: builder.query({
      query: (params?: any) => ({
        url: "/reports/order-trip-waypoint",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /reports/revenue
     * Get revenue report
     *
     * Query params:
     * - start_date: string (YYYY-MM-DD)
     * - end_date: string (YYYY-MM-DD)
     * - customer_id: string (optional)
     * - group_by: string (optional) - day|week|month
     * - downloadable: boolean (optional) - triggers Excel download
     */
    getRevenueReport: builder.query({
      query: (params?: any) => ({
        url: "/reports/revenue",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /reports/driver-performance
     * Get driver performance report with sorting
     *
     * Query params:
     * - start_date: string (YYYY-MM-DD)
     * - end_date: string (YYYY-MM-DD)
     * - driver_id: string (optional)
     * - sort_by: string (optional) - trip_count|success_rate|delivery_time
     * - downloadable: boolean (optional) - triggers Excel download
     * - page: number (optional)
     * - limit: number (optional)
     */
    getDriverPerformanceReport: builder.query({
      query: (params?: any) => ({
        url: "/reports/driver-performance",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /reports/customer
     * Get customer report with sorting
     *
     * Query params:
     * - start_date: string (YYYY-MM-DD)
     * - end_date: string (YYYY-MM-DD)
     * - customer_id: string (optional)
     * - sort_by: string (optional) - revenue|order_count
     * - downloadable: boolean (optional) - triggers Excel download
     * - page: number (optional)
     * - limit: number (optional)
     */
    getCustomerReport: builder.query({
      query: (params?: any) => ({
        url: "/reports/customer",
        method: "GET",
        params,
      }),
    }),
  }),
});

// ============================================================================
// Report Response Types
// ============================================================================

/**
 * Order Trip Waypoint Report Response
 * Reference: backend/src/usecase/report.go - OrderTripWaypointReport
 */
export interface OrderTripWaypointReportResponse {
  data: OrderTripWaypointItem[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderTripWaypointItem {
  order_number: string;
  order_type: string;
  order_status: string;
  customer_name: string;
  trip_id: string;
  trip_status: string;
  driver_name: string;
  vehicle_plate_number: string;
  waypoint_sequence: number;
  waypoint_type: string;
  address: string;
  recipient_name: string;
  waypoint_status: string;
  completed_at: string | null;
}

/**
 * Revenue Report Response
 * Reference: backend/src/usecase/report.go - RevenueReport
 */
export interface RevenueReportResponse {
  total_revenue: number;
  revenue_by_date: RevenueDateSummary[];
  revenue_by_customer: RevenueCustomerSummary[];
}

export interface RevenueDateSummary {
  date: string;
  revenue: number;
}

export interface RevenueCustomerSummary {
  customer_name: string;
  revenue: number;
  order_count: number;
}

/**
 * Driver Performance Report Response
 * Reference: backend/src/usecase/report.go - DriverPerformanceReportWrapper
 */
export interface DriverPerformanceReportResponse {
  data: DriverPerformanceItem[];
  total: number;
  page: number;
  limit: number;
}

export interface DriverPerformanceItem {
  driver_id: string;
  driver_name: string;
  total_trips: number;
  completed_trips: number;
  on_time_trips: number;
  on_time_rate: number;
}

/**
 * Customer Report Response
 * Reference: backend/src/usecase/report.go - CustomerReport
 */
export interface CustomerReportResponse {
  data: CustomerReportItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerReportItem {
  customer_id: string;
  customer_name: string;
  order_count: number;
  total_revenue: number;
  completed_waypoints: number;
  failed_waypoints: number;
  success_rate: number;
}

// ============================================================================
// Re-export legacy types from services/types (for backward compatibility)
// ============================================================================
export type {
  OrderSummaryReport,
  TripSummaryReport,
  RevenueReport,
  ExceptionReport,
  DriverPerformanceReport,
  ReportParams,
} from "@/services/types";

// ============================================================================
// Export RTK Query hooks
// ============================================================================
export const {
  useLazyGetOrderTripWaypointReportQuery,
  useLazyGetRevenueReportQuery,
  useLazyGetDriverPerformanceReportQuery,
  useLazyGetCustomerReportQuery,
} = reportApi;
