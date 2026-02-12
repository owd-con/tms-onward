import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Region API (region-id library v0.1.3)
 *
 * Provides unified search functionality for Indonesian regions
 *
 * @module regionApi
 */
export const regionApi = createApi({
  reducerPath: "regionApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /regions/search
     * Full-text search for regions with filters
     */
    searchRegions: builder.query({
      query: (params?: any) => ({
        url: "/regions/search",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /regions/:id
     * Get a region by its ID
     */
    getRegion: builder.query({
      query: (id) => ({
        url: `/regions/${id}`,
        method: "GET",
      }),
    }),

    /**
     * GET /regions/:id/children
     * Get direct children of a region
     */
    getRegionChildren: builder.query({
      query: (id) => ({
        url: `/regions/${id}/children`,
        method: "GET",
      }),
    }),

    /**
     * GET /regions/:id/path
     * Get full hierarchical path from root to given region
     */
    getRegionPath: builder.query({
      query: (id) => ({
        url: `/regions/${id}/path`,
        method: "GET",
      }),
    }),
  }),
});

// ============================================================================
// Export RTK Query hooks
// ============================================================================

export const {
  useLazySearchRegionsQuery,
  useLazyGetRegionQuery,
  useLazyGetRegionChildrenQuery,
  useLazyGetRegionPathQuery,
} = regionApi;
