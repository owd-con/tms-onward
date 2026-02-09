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

    /**
     * PUT /exceptions/waypoints/:id/return
     * Return a failed waypoint to origin
     */
    returnWaypoint: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/exceptions/waypoints/${id}/return`,
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useBatchRescheduleWaypointsMutation,
  useReturnWaypointMutation,
} = exceptionApi;
