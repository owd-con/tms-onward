import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../baseQuery";

/**
 * TMS Driver - Order API
 *
 * Endpoints for order details and scan functionality
 */
export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /order/:id
     * Get order details by ID
     */
    showOrderDetail: builder.query({
      query: ({ id, ...params }) => ({
        url: `/orders/${id}`,
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /orders/:id/waypoint-preview
     * Get waypoint preview for an order (auto-generated from shipments)
     */
    getWaypointPreview: builder.query({
      query: ({ id }) => ({
        url: `/orders/${id}/waypoint-preview`,
        method: "GET",
      }),
    }),

    /**
     * POST /driver/receive-order
     * Driver accepts an order and creates a trip
     */
    receiveOrder: builder.mutation({
      query: (payload) => ({
        url: "/driver/receive-order",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * GET /vehicles
     * Get available vehicles for driver selection
     */
    getVehicles: builder.query({
      query: (params?: any) => ({
        url: "/vehicles",
        method: "GET",
        params,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazyShowOrderDetailQuery,
  useLazyGetWaypointPreviewQuery,
  useLazyGetVehiclesQuery,
  useReceiveOrderMutation,
} = orderApi;
