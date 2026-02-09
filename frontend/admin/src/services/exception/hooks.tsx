import { exceptionApi } from "./api";

/**
 * TMS Onward - Exception Hooks
 * Custom hooks for exception management operations
 */

export const useException = () => {
  const [batchRescheduleWaypoints, batchRescheduleResult] =
    exceptionApi.useBatchRescheduleWaypointsMutation();
  const [returnWaypoint, returnWaypointResult] =
    exceptionApi.useReturnWaypointMutation();

  return {
    batchRescheduleWaypoints,
    batchRescheduleResult,
    returnWaypoint,
    returnWaypointResult,
  };
};

export default useException;
