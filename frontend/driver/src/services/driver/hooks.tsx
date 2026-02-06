import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetActiveTripsQuery,
  useLazyShowTripDetailQuery,
  useLazyGetTripHistoryQuery,
  useStartTripMutation,
  useStartWaypointMutation,
  useArriveWaypointMutation,
  useCompleteWaypointMutation,
  useFailWaypointMutation,
} from "./api";

/**
 * TMS Driver - Trip Hook
 *
 * Custom hook for driver trip operations using createCrudHook pattern.
 */
export const useTrip = createCrudHook({
  useLazyGetQuery: useLazyGetActiveTripsQuery,
  useLazyShowQuery: useLazyShowTripDetailQuery,
  entityName: "trip",
  additionalQueries: {
    getHistory: useLazyGetTripHistoryQuery,
  },
  customOperations: {
    startTrip: {
      hook: useStartTripMutation,
      errorMessage: "Failed to start trip",
      requiresId: true,
    },
    // v2.10 Waypoint Operations
    startWaypoint: {
      hook: useStartWaypointMutation,
      errorMessage: "Failed to start waypoint",
      requiresId: true,
    },
    arriveWaypoint: {
      hook: useArriveWaypointMutation,
      errorMessage: "Failed to complete pickup",
      requiresId: true,
    },
    completeWaypoint: {
      hook: useCompleteWaypointMutation,
      errorMessage: "Failed to complete delivery",
      requiresId: false,
    },
    failWaypoint: {
      hook: useFailWaypointMutation,
      errorMessage: "Failed to report waypoint issue",
      requiresId: false,
    },
  },
});
