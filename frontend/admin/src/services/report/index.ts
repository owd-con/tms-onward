/**
 * TMS Onward - Report Service
 *
 * Exports all report-related functionality for easy importing.
 */

// Export API hooks
export {
  reportApi,
  useLazyGetOrderReportQuery,
  useLazyGetTripReportQuery,
  useLazyGetRevenueReportQuery,
  useLazyGetExceptionReportQuery,
  useLazyGetDriverPerformanceReportQuery,
} from "./api";

// Export custom hook
export { useReport } from "./hooks";

// Note: Report types are exported from @/services/types
