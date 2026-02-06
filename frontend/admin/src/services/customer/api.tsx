import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Customer API
 */
export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /customers
     * List customers with pagination
     */
    getCustomers: builder.query({
      query: (params?: any) => ({
        url: "/customers",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /customers/:id
     * Get customer detail
     */
    showCustomer: builder.query({
      query: ({ id, ...params }) => ({
        url: `/customers/${id}`,
        method: "GET",
        params,
      }),
    }),

    /**
     * POST /customers
     * Create new customer
     */
    createCustomer: builder.mutation({
      query: (payload) => ({
        url: "/customers",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * PUT /customers/:id
     * Update customer
     */
    updateCustomer: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * DELETE /customers/:id
     * Delete customer (soft delete)
     */
    removeCustomer: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/customers/${id}`,
        method: "DELETE",
        body: payload,
      }),
    }),

    /**
     * PUT /customers/:id/activate
     * Activate customer
     */
    activateCustomer: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/customers/${id}/activate`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * PUT /customers/:id/deactivate
     * Deactivate customer
     */
    deactivateCustomer: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/customers/${id}/deactivate`,
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazyGetCustomersQuery,
  useLazyShowCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useRemoveCustomerMutation,
  useActivateCustomerMutation,
  useDeactivateCustomerMutation,
} = customerApi;
