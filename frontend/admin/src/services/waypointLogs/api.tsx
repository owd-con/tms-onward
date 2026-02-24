/**
 * TMS Onward - Waypoint Logs API Service
 *
 * API service for waypoint logs (tracking history).
 * Reference: Blueprint v2.10 - Section 3.10
 */

import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

export const waypointLogsApi = createApi({
  reducerPath: "waypointLogsApi",
  baseQuery,
  endpoints: (builder) => ({
    // GET /waypoint/logs - Get waypoint logs with filters
    getWaypointLogs: builder.query({
      query: (params) => ({
        url: "/waypoint/logs",
        method: "GET",
        params,
      }),
    }),
  }),
});

// Export hooks
export const {
  useLazyGetWaypointLogsQuery,
} = waypointLogsApi;
