import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetTripsQuery,
  useLazyShowTripQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useRemoveTripMutation,
  useStartTripMutation,
  useCompleteTripMutation,
  useDispatchTripMutation,
  useCancelTripMutation,
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
    dispatch: {
      hook: useDispatchTripMutation,
      errorMessage: "Failed to dispatch trip",
    },
    cancel: {
      hook: useCancelTripMutation,
      errorMessage: "Failed to cancel trip",
    },
  },
  entityName: "trip",
});
