import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Order API
 * For order management operations
 */
export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /orders
     * Get paginated list of orders
     */
    getOrders: builder.query({
      query: (params) => ({
        url: "/orders",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /orders/:id
     * Get order detail
     */
    showOrder: builder.query({
      query: ({ id, ...params }) => ({
        url: `/orders/${id}`,
        method: "GET",
        params,
      }),
    }),

    /**
     * POST /orders
     * Create new order
     */
    createOrder: builder.mutation({
      query: (payload) => ({
        url: "/orders",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * PUT /orders/:id
     * Update order
     */
    updateOrder: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/orders/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * DELETE /orders/:id
     * Delete order (soft delete)
     */
    removeOrder: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/orders/${id}`,
        method: "DELETE",
        body: payload,
      }),
    }),

    /**
     * PUT /orders/:id/cancel
     * Cancel order
     */
    cancelOrder: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/orders/${id}/cancel`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * GET /orders/:id/waypoint-preview
     * Get waypoint preview for trip creation
     */
    getWaypointPreview: builder.query({
      query: ({ id }) => ({
        url: `/orders/${id}/waypoint-preview`,
        method: "GET",
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazyGetOrdersQuery,
  useLazyShowOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useRemoveOrderMutation,
  useCancelOrderMutation,
  useLazyGetWaypointPreviewQuery,
} = orderApi;
