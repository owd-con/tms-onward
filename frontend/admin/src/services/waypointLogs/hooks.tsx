/**
 * TMS Onward - Waypoint Logs Custom Hooks
 *
 * Custom hooks for waypoint logs using createCrudHook pattern.
 */

import { createCrudHook } from "@/services/hooks/createCrudHook";
import { useLazyGetWaypointLogsQuery } from "./api";

// Noop query - domain doesn't have standard list endpoint
const useNoopQuery = () =>
  [
    async () => undefined,
    {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: false,
    },
  ] as const;

export const useWaypointLogs = createCrudHook({
  useLazyGetQuery: useNoopQuery, // Required tapi tidak dipakai
  additionalQueries: {
    getWaypointLogs: useLazyGetWaypointLogsQuery,
  },
  entityName: "waypointLogs",
});
