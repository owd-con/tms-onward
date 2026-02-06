import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetOrderReportQuery,
  useLazyGetTripReportQuery,
  useLazyGetRevenueReportQuery,
  useLazyGetExceptionReportQuery,
  useLazyGetDriverPerformanceReportQuery,
} from "./api";

// Noop query for createCrudHook - reports don't have a standard list endpoint
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
 */
export const useReport = createCrudHook({
  useLazyGetQuery: useNoopQuery,
  additionalQueries: {
    getOrderReport: useLazyGetOrderReportQuery,
    getTripReport: useLazyGetTripReportQuery,
    getRevenueReport: useLazyGetRevenueReportQuery,
    getExceptionReport: useLazyGetExceptionReportQuery,
    getDriverPerformanceReport: useLazyGetDriverPerformanceReportQuery,
  },
  entityName: "report",
});
