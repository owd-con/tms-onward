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
     * GET /exceptions/orders
     * Get orders with failed shipments
     */
    getExceptionOrders: builder.query({
      query: (params) => ({
        url: "/exceptions/orders",
        method: "GET",
        params,
      }),
    }),

    /**
     * POST /exceptions/shipments/batch-reschedule
     * Batch reschedule failed shipments with new driver & vehicle (delivery only)
     */
    batchRescheduleShipments: builder.mutation({
      query: (payload) => ({
        url: "/exceptions/shipments/batch-reschedule",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * PUT /exceptions/shipments/:id/return
     * Return a failed shipment to origin
     */
    returnShipment: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/exceptions/shipments/${id}/return`,
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazyGetExceptionOrdersQuery,
  useBatchRescheduleShipmentsMutation,
  useReturnShipmentMutation,
} = exceptionApi;
