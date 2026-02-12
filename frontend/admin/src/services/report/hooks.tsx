import { createCrudHook } from "@/services/hooks/createCrudHook";
import {
  useLazyGetOrderTripWaypointReportQuery,
  useLazyGetRevenueReportQuery,
  useLazyGetDriverPerformanceReportQuery,
  useLazyGetCustomerReportQuery,
} from "./api";

// Noop query - report doesn't have a standard list endpoint
const useNoopQuery = () => [
  async () => undefined,
  {
    data: undefined,
    isLoading: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
  },
] as const;

/**
 * TMS Onward - Report Hook
 *
 * Custom hook for report operations.
 * Provides methods for fetching various reports with consistent error handling.
 *
 * @example
 * ```tsx
 * const { getOrderTripWaypointReport, getOrderTripWaypointReportResult } = useReport();
 *
 * await getOrderTripWaypointReport({
 *   start_date: "2024-01-01",
 *   end_date: "2024-01-31",
 * });
 *
 * const data = getOrderTripWaypointReportResult?.data;
 * ```
 */
export const useReport = createCrudHook({
  useLazyGetQuery: useNoopQuery, // Required but not used
  additionalQueries: {
    getOrderTripWaypointReport: useLazyGetOrderTripWaypointReportQuery,
    getRevenueReport: useLazyGetRevenueReportQuery,
    getDriverPerformanceReport: useLazyGetDriverPerformanceReportQuery,
    getCustomerReport: useLazyGetCustomerReportQuery,
  },
  entityName: "report",
});
