import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Trip API
 * For trip management operations (Direct Assignment)
 *
 * Reference: backend/src/handler/rest/trip/
 */
export const tripApi = createApi({
  reducerPath: "tripApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /trips
     * Get paginated list of trips
     * Filters: driver_id, vehicle_id, status, date_range
     */
    getTrips: builder.query({
      query: (params) => ({
        url: "/trips",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /trips/:id
     * Get trip detail
     */
    showTrip: builder.query({
      query: ({ id, ...params }) => ({
        url: `/trips/${id}`,
        method: "GET",
        params,
      }),
    }),

    /**
     * POST /trips
     * Create new trip (Direct Assignment: assign driver + vehicle to order)
     * For FTL: sequence from order (read-only)
     * For LTL: manual sequence assignment
     */
    createTrip: builder.mutation({
      query: (payload) => ({
        url: "/trips",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * PUT /trips/:id
     * Update trip (before started)
     */
    updateTrip: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/trips/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * DELETE /trips/:id
     * Cancel trip (soft delete)
     */
    removeTrip: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/trips/${id}`,
        method: "DELETE",
        body: payload,
      }),
    }),

    /**
     * PUT /trips/:id/start
     * Start trip (Dispatched → In Transit)
     */
    startTrip: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/trips/${id}/start`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * PUT /trips/:id/complete
     * Complete trip (In Transit → Completed)
     */
    completeTrip: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/trips/${id}/complete`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * PUT /trips/:id/cancel
     * Cancel trip (any status → Cancelled)
     */
    cancelTrip: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/trips/${id}/cancel`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * PUT /trips/:id/reassign-driver
     * Reassign driver to a trip (before started)
     */
    reassignDriver: builder.mutation({
      query: ({ id, driver_id }) => ({
        url: `/trips/${id}/reassign-driver`,
        method: "PUT",
        body: { driver_id },
      }),
    }),

  }),
});

// Export RTK Query hooks
export const {
  useLazyGetTripsQuery,
  useLazyShowTripQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useRemoveTripMutation,
  useStartTripMutation,
  useCompleteTripMutation,
  useCancelTripMutation,
  useReassignDriverMutation,
} = tripApi;
