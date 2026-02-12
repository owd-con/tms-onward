import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Driver API
 */
export const driverApi = createApi({
  reducerPath: "driverApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /drivers
     * List drivers with pagination
     */
    getDrivers: builder.query({
      query: (params) => ({
        url: "/drivers",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /drivers/:id
     * Get driver detail
     */
    showDriver: builder.query({
      query: ({ id, ...params }) => ({
        url: `/drivers/${id}`,
        method: "GET",
        params,
      }),
    }),

    /**
     * POST /drivers
     * Create new driver
     */
    createDriver: builder.mutation({
      query: (payload) => ({
        url: "/drivers",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * PUT /drivers/:id
     * Update driver
     */
    updateDriver: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/drivers/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * DELETE /drivers/:id
     * Delete driver (soft delete)
     */
    removeDriver: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/drivers/${id}`,
        method: "DELETE",
        body: payload,
      }),
    }),

    /**
     * PUT /drivers/:id/activate
     * Activate driver
     */
    activateDriver: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/drivers/${id}/activate`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * PUT /drivers/:id/deactivate
     * Deactivate driver
     */
    deactivateDriver: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/drivers/${id}/deactivate`,
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazyGetDriversQuery,
  useLazyShowDriverQuery,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useRemoveDriverMutation,
  useActivateDriverMutation,
  useDeactivateDriverMutation,
} = driverApi;
