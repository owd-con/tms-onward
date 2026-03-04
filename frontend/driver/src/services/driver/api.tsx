import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../baseQuery";

// ==============================
// RTK Query API Definition
// ==============================

export const driverApi = createApi({
  reducerPath: "driverApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /driver/trips
     * Get active trips for the authenticated driver (Planned, Dispatched, In Transit only)
     */
    getActiveTrips: builder.query({
      query: (params?: any) => ({
        url: "/driver/trips",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /driver/trips/history
     * Get all trips for the authenticated driver (all statuses)
     */
    getTripHistory: builder.query({
      query: (params?: any) => ({
        url: "/driver/trips/history",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /driver/trips/:id
     * Get detailed trip information with waypoints
     */
    showTripDetail: builder.query({
      query: ({ id, ...params }) => ({
        url: `/driver/trips/${id}`,
        method: "GET",
        params,
      }),
    }),

    /**
     * PUT /driver/trips/:id/start
     * Start a dispatched trip (Dispatched → In Transit)
     */
    startTrip: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/driver/trips/${id}/start`,
        method: "PUT",
        body: payload,
      }),
    }),

    // ============================================
    // v2.10 New Waypoint Endpoints
    // ============================================

    /**
     * PUT /driver/trips/waypoint/:id/start
     * Start waypoint execution (Pending → In Transit)
     * v2.10
     */
    startWaypoint: builder.mutation({
      query: ({ id }) => ({
        url: `/driver/trips/waypoint/${id}/start`,
        method: "PUT",
      }),
    }),

    /**
     * PUT /driver/trips/waypoint/:id/loading
     * Complete pickup loading (In Transit → Loaded)
     * For Pickup type only.
     * v2.10
     */
    loadingWaypoint: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/driver/trips/waypoint/${id}/loading`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * PUT /driver/trips/waypoint/:id/arrive
     * Arrive at delivery point (In Transit → Arrived)
     * For Delivery type only.
     * v2.10
     */
    arriveWaypoint: builder.mutation({
      query: ({ id }) => ({
        url: `/driver/trips/waypoint/${id}/arrive`,
        method: "PUT",
      }),
    }),

    /**
     * PUT /driver/trips/waypoint/:id/complete
     * Complete delivery with POD (In Transit → Completed)
     * For Delivery type only.
     * Request body: { received_by, signature_url, images[], note? }
     * v2.10
     */
    completeWaypoint: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/driver/trips/waypoint/${id}/complete`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * PUT /driver/trips/waypoint/:id/failed
     * Report failed waypoint (In Transit → Completed/Failed)
     * For both Pickup and Delivery types.
     * Request body: { failed_reason, images[] }
     * v2.10
     */
    failWaypoint: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/driver/trips/waypoint/${id}/failed`,
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazyGetActiveTripsQuery,
  useLazyGetTripHistoryQuery,
  useLazyShowTripDetailQuery,
  useStartTripMutation,
  useStartWaypointMutation,
  useLoadingWaypointMutation,
  useArriveWaypointMutation,
  useCompleteWaypointMutation,
  useFailWaypointMutation,
} = driverApi;
