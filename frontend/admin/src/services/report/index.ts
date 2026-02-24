/**
 * TMS Onward - Report Service
 *
 * Exports all report-related functionality for easy importing.
 */

// Export API hooks
export {
  reportApi,
  useLazyGetOrderTripWaypointReportQuery,
  useLazyGetRevenueReportQuery,
  useLazyGetDriverPerformanceReportQuery,
  useLazyGetCustomerReportQuery,
} from "./api";

// Export custom hook
export { useReport } from "./hooks";

// Note: Report types are exported from @/services/types
