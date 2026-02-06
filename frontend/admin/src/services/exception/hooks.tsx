import { exceptionApi } from "./api";

/**
 * TMS Onward - Exception Hooks
 * Custom hooks for exception management operations
 */

export const useException = () => {
  const [batchRescheduleWaypoints, batchRescheduleResult] =
    exceptionApi.useBatchRescheduleWaypointsMutation();

  return {
    batchRescheduleWaypoints,
    batchRescheduleResult,
  };
};

export default useException;
