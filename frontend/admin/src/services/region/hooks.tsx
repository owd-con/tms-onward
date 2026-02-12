/**
 * TMS Onward - Region Service Hooks
 *
 * Custom hooks for region search and lookup using createCrudHook pattern.
 */

import { createCrudHook } from "@/services/hooks/createCrudHook";
import {
  useLazySearchRegionsQuery,
  useLazyGetRegionQuery,
  useLazyGetRegionChildrenQuery,
  useLazyGetRegionPathQuery,
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

export const useRegion = createCrudHook({
  useLazyGetQuery: useNoopQuery, // Required but not used
  additionalQueries: {
    searchRegions: useLazySearchRegionsQuery,
    getRegion: useLazyGetRegionQuery,
    getRegionChildren: useLazyGetRegionChildrenQuery,
    getRegionPath: useLazyGetRegionPathQuery,
  },
  entityName: "region",
});
