import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";
import type { Region, RegionSearchResult, RegionType, RegionPath, AdministrativeArea } from "@/services/types";

export interface RegionSearchParams {
  q?: string; // Search query
  type?: RegionType; // Filter by type (province, regency, district, village)
  parent_id?: string; // Filter by parent ID
  limit?: number; // Max results (default: 20)
  offset?: number; // Offset for pagination
}

// Response format from backend region-id library
export interface RegionSearchResponse {
  results: RegionSearchResult[];
  total: number;
}

// Transform backend response to RemoteSelect-compatible format
export interface RegionSearchPaginatedResponse {
  data: RegionSearchResult[];
  meta: {
    total: number;
    total_pages: number;
    page: number;
    limit: number;
  };
}

/**
 * TMS Onward - Region API (region-id library v0.1.3)
 * Provides unified search functionality for Indonesian regions
 *
 * API Endpoints:
 * - GET /regions/search - Full-text search with filters
 * - GET /regions/:id - Get region by ID
 * - GET /regions/:id/children - Get direct children
 * - GET /regions/:id/path - Get full hierarchy path
 */
export const regionApi = createApi({
  reducerPath: "regionApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /regions/search
     * Full-text search for regions with filters
     */
    searchRegions: builder.query<RegionSearchPaginatedResponse, RegionSearchParams>({
      query: (params) => ({
        url: "/regions/search",
        method: "GET",
        params: {
          q: params.q,
          type: params.type,
          parent_id: params.parent_id,
          limit: params.limit || 20,
          offset: params.offset || 0,
        },
      }),
      transformResponse: (response: RegionSearchResponse, _, arg) => {
        const limit = arg.limit || 20;
        return {
          data: response.results,
          meta: {
            total: response.total,
            total_pages: Math.ceil(response.total / limit),
            page: Math.floor((arg.offset || 0) / limit) + 1,
            limit: limit,
          },
        };
      },
    }),

    /**
     * GET /regions/:id
     * Get a region by its ID with full hierarchy path
     */
    getRegion: builder.query<Region, string>({
      query: (id) => ({
        url: `/regions/${id}`,
        method: "GET",
      }),
    }),

    /**
     * GET /regions/:id/children
     * Get direct children of a region
     */
    getRegionChildren: builder.query<Region[], string>({
      query: (id) => ({
        url: `/regions/${id}/children`,
        method: "GET",
      }),
    }),

    /**
     * GET /regions/:id/path
     * Get full hierarchical path from root to the given region
     */
    getRegionPath: builder.query<RegionPath[], string>({
      query: (id) => ({
        url: `/regions/${id}/path`,
        method: "GET",
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazySearchRegionsQuery,
  useSearchRegionsQuery,
  useLazyGetRegionQuery,
  useGetRegionQuery,
  useLazyGetRegionChildrenQuery,
  useGetRegionChildrenQuery,
  useLazyGetRegionPathQuery,
  useGetRegionPathQuery,
} = regionApi;

// Re-export types for convenience
export type { Region, RegionSearchResult, RegionPath, AdministrativeArea } from "@/services/types";

/**
 * Helper function to get full_name from administrative_area
 * This matches the backend logic from region-id library
 */
export function getFullName(administrativeArea: AdministrativeArea): string {
  const parts = [];

  if (administrativeArea.village) {
    parts.push(administrativeArea.village);
  }
  if (administrativeArea.district) {
    parts.push(administrativeArea.district);
  }
  if (administrativeArea.regency) {
    parts.push(administrativeArea.regency);
  }
  if (administrativeArea.province) {
    parts.push(administrativeArea.province);
  }
  if (administrativeArea.country) {
    parts.push(administrativeArea.country);
  }

  return parts.join(", ");
}

/**
 * Helper function to get display path from administrative_area
 * Returns: "Province, Regency, District, Village"
 */
export function getDisplayPath(administrativeArea: AdministrativeArea): string {
  const parts = [];

  if (administrativeArea.province) {
    parts.push(administrativeArea.province);
  }
  if (administrativeArea.regency) {
    parts.push(administrativeArea.regency);
  }
  if (administrativeArea.district) {
    parts.push(administrativeArea.district);
  }
  if (administrativeArea.village) {
    parts.push(administrativeArea.village);
  }

  return parts.join(", ");
}
