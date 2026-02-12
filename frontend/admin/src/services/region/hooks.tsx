/**
 * TMS Onward - Region Service Hooks
 *
 * Custom hooks for region search and lookup.
 * Region API doesn't follow standard CRUD pattern, so we use custom hooks.
 */

import { useCallback } from "react";
import {
  useLazySearchRegionsQuery,
  useLazyGetRegionQuery,
  useLazyGetRegionChildrenQuery,
  useLazyGetRegionPathQuery,
} from "./api";
import type { RegionSearchParams } from "./api";
import type { Region, RegionSearchResult, RegionPath } from "@/services/types";

/**
 * Region CRUD operations hook
 */
export const useRegion = () => {
  // Search regions hook
  const [triggerSearch, searchResult] = useLazySearchRegionsQuery();
  const [triggerGet, getResult] = useLazyGetRegionQuery();
  const [triggerChildren, childrenResult] = useLazyGetRegionChildrenQuery();
  const [triggerPath, pathResult] = useLazyGetRegionPathQuery();

  // Search regions
  const searchRegions = useCallback(
    async (params: RegionSearchParams) => {
      const result = await triggerSearch(params, true);
      return result.data;
    },
    [triggerSearch]
  );

  // Get region by ID
  const getRegion = useCallback(
    async (id: string) => {
      const result = await triggerGet(id, true);
      return result.data;
    },
    [triggerGet]
  );

  // Get region children
  const getRegionChildren = useCallback(
    async (id: string) => {
      const result = await triggerChildren(id, true);
      return result.data;
    },
    [triggerChildren]
  );

  // Get region path
  const getRegionPath = useCallback(
    async (id: string) => {
      const result = await triggerPath(id, true);
      return result.data;
    },
    [triggerPath]
  );

  return {
    // Operations
    searchRegions,
    getRegion,
    getRegionChildren,
    getRegionPath,

    // Results
    searchResult,
    getResult,
    childrenResult,
    pathResult,
  };
};

export type { Region, RegionSearchParams, RegionSearchResult, RegionPath } from "./api";
export type { RegionType } from "@/services/types";
