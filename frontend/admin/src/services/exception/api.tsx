import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Exception API
 * For exception management operations
 */
export const exceptionApi = createApi({
  reducerPath: "exceptionApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * POST /exceptions/waypoints/batch-reschedule
     * Batch reschedule failed waypoints with new driver & vehicle
     */
    batchRescheduleWaypoints: builder.mutation({
      query: (payload) => ({
        url: "/exceptions/waypoints/batch-reschedule",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useBatchRescheduleWaypointsMutation,
} = exceptionApi;
