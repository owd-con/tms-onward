import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Pricing Matrix API
 */
export const pricingMatrixApi = createApi({
  reducerPath: "pricingMatrixApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /pricing-matrices
     * List pricing matrices with filters
     */
    getPricingMatrices: builder.query({
      query: (params?: any) => ({
        url: "/pricing-matrices",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /pricing-matrices/:id
     * Get pricing matrix detail
     */
    showPricingMatrix: builder.query({
      query: ({ id, ...params }) => ({
        url: `/pricing-matrices/${id}`,
        method: "GET",
        params,
      }),
    }),

    /**
     * POST /pricing-matrices
     * Create new pricing matrix
     */
    createPricingMatrix: builder.mutation({
      query: (payload) => ({
        url: "/pricing-matrices",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * PUT /pricing-matrices/:id
     * Update pricing matrix
     */
    updatePricingMatrix: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/pricing-matrices/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * DELETE /pricing-matrices/:id
     * Delete pricing matrix
     */
    deletePricingMatrix: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/pricing-matrices/${id}`,
        method: "DELETE",
        body: payload,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazyGetPricingMatricesQuery,
  useLazyShowPricingMatrixQuery,
  useCreatePricingMatrixMutation,
  useUpdatePricingMatrixMutation,
  useDeletePricingMatrixMutation,
} = pricingMatrixApi;
