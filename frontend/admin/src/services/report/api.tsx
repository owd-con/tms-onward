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
     * GET /reports/orders
     * Get order summary report
     */
    getOrderReport: builder.query({
      query: (params?: any) => ({
        url: "/reports/orders",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /reports/trips
     * Get trip summary report
     */
    getTripReport: builder.query({
      query: (params?: any) => ({
        url: "/reports/trips",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /reports/revenue
     * Get revenue report
     */
    getRevenueReport: builder.query({
      query: (params?: any) => ({
        url: "/reports/revenue",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /reports/exceptions
     * Get exception report
     */
    getExceptionReport: builder.query({
      query: (params?: any) => ({
        url: "/reports/exceptions",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /reports/drivers
     * Get driver performance report
     */
    getDriverPerformanceReport: builder.query({
      query: (params?: any) => ({
        url: "/reports/drivers",
        method: "GET",
        params,
      }),
    }),
  }),
});

// Re-export report types from services/types
export type {
  OrderSummaryReport,
  TripSummaryReport,
  RevenueReport,
  ExceptionReport,
  DriverPerformanceReport,
  ReportParams,
} from "@/services/types";

// Export RTK Query hooks
export const {
  useLazyGetOrderReportQuery,
  useLazyGetTripReportQuery,
  useLazyGetRevenueReportQuery,
  useLazyGetExceptionReportQuery,
  useLazyGetDriverPerformanceReportQuery,
} = reportApi;
