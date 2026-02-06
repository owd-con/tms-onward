import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Address API
 * For CRUD saved addresses
 */
export const addressApi = createApi({
  reducerPath: "addressApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /addresses
     * Get paginated list of addresses
     * Supports filtering by customer_id (when creating orders for specific customers)
     */
    getAddresses: builder.query({
      query: (params?: any) => ({
        url: "/addresses",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /addresses/:id
     * Get address detail
     */
    showAddress: builder.query({
      query: ({ id, ...params }) => ({
        url: `/addresses/${id}`,
        method: "GET",
        params,
      }),
    }),

    /**
     * POST /addresses
     * Create new address
     */
    createAddress: builder.mutation({
      query: (payload) => ({
        url: "/addresses",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * PUT /addresses/:id
     * Update address
     */
    updateAddress: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/addresses/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * DELETE /addresses/:id
     * Delete address (soft delete)
     */
    removeAddress: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/addresses/${id}`,
        method: "DELETE",
        body: payload,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazyGetAddressesQuery,
  useLazyShowAddressQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useRemoveAddressMutation,
} = addressApi;
