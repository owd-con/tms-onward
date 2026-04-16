import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetTripsQuery,
  useLazyShowTripQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useRemoveTripMutation,
  useStartTripMutation,
  useCompleteTripMutation,
  useCancelTripMutation,
  useReassignDriverMutation,
} from "./api";

export const useTrip = createCrudHook({
  useLazyGetQuery: useLazyGetTripsQuery,
  useLazyShowQuery: useLazyShowTripQuery,
  useCreateMutation: useCreateTripMutation,
  useUpdateMutation: useUpdateTripMutation,
  useRemoveMutation: useRemoveTripMutation,
  customOperations: {
    start: {
      hook: useStartTripMutation,
      errorMessage: "Failed to start trip",
    },
    complete: {
      hook: useCompleteTripMutation,
      errorMessage: "Failed to complete trip",
    },
    cancel: {
      hook: useCancelTripMutation,
      errorMessage: "Failed to cancel trip",
    },
    reassignDriver: {
      hook: useReassignDriverMutation,
      errorMessage: "Failed to reassign driver",
    },
  },
  entityName: "trip",
});
