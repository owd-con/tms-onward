import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyShowOrderDetailQuery,
  useLazyGetWaypointPreviewQuery,
  useReceiveOrderMutation,
  useLazyGetVehiclesQuery,
} from "./api";

// Noop query - region doesn't have standard CRUD list endpoint
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

/**
 * TMS Driver - Order Hook
 *
 * Custom hook for order operations using createCrudHook pattern.
 * Includes additional queries for waypoint preview and vehicle list.
 */
export const useOrder = createCrudHook({
  useLazyGetQuery: useNoopQuery, // Required but not used
  useLazyShowQuery: useLazyShowOrderDetailQuery,
  entityName: "order",
  additionalQueries: {
    getWaypointPreview: useLazyGetWaypointPreviewQuery,
    getVehicles: useLazyGetVehiclesQuery,
  },
  customOperations: {
    receiveOrder: {
      hook: useReceiveOrderMutation,
      errorMessage: "Failed to receive order",
      requiresId: false,
    },
  },
});
