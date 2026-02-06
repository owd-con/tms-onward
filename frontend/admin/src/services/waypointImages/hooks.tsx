/**
 * TMS Onward - Waypoint Images Custom Hooks
 *
 * Custom hooks for waypoint images using createCrudHook pattern.
 */

import { createCrudHook } from "@/services/hooks/createCrudHook";
import {
  useLazyGetWaypointImagesQuery,
} from "./api";

// Noop query - domain doesn't have standard list endpoint
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

export const useWaypointImages = createCrudHook({
  useLazyGetQuery: useNoopQuery, // Required tapi tidak dipakai
  additionalQueries: {
    getWaypointImages: useLazyGetWaypointImagesQuery,
  },
  entityName: "waypointImages",
});
