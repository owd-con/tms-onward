/**
 * TMS Onward - Waypoint Images API Service
 *
 * API service for waypoint images (POD & failed evidence).
 * Reference: Blueprint v2.10 - Section 3.10
 */

import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

export const waypointImagesApi = createApi({
  reducerPath: "waypointImagesApi",
  baseQuery,
  endpoints: (builder) => ({
    // GET /waypoint/images - Get waypoint images with filters
    getWaypointImages: builder.query({
      query: (params) => ({
        url: "/waypoint/images",
        method: "GET",
        params,
      }),
    }),
  }),
});

// Export hooks
export const {
  useLazyGetWaypointImagesQuery,
} = waypointImagesApi;
