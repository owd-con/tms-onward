import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Vehicle API
 */
export const vehicleApi = createApi({
  reducerPath: "vehicleApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /vehicles
     * List vehicles with pagination
     */
    getVehicles: builder.query({
      query: (params?: any) => ({
        url: "/vehicles",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /vehicles/:id
     * Get vehicle detail
     */
    showVehicle: builder.query({
      query: ({ id, ...params }) => ({
        url: `/vehicles/${id}`,
        method: "GET",
        params,
      }),
    }),

    /**
     * POST /vehicles
     * Create new vehicle
     */
    createVehicle: builder.mutation({
      query: (payload) => ({
        url: "/vehicles",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * PUT /vehicles/:id
     * Update vehicle
     */
    updateVehicle: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/vehicles/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * DELETE /vehicles/:id
     * Delete vehicle (soft delete)
     */
    removeVehicle: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/vehicles/${id}`,
        method: "DELETE",
        body: payload,
      }),
    }),

    /**
     * PUT /vehicles/:id/activate
     * Activate vehicle
     */
    activateVehicle: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/vehicles/${id}/activate`,
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * PUT /vehicles/:id/deactivate
     * Deactivate vehicle
     */
    deactivateVehicle: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/vehicles/${id}/deactivate`,
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazyGetVehiclesQuery,
  useLazyShowVehicleQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useRemoveVehicleMutation,
  useActivateVehicleMutation,
  useDeactivateVehicleMutation,
} = vehicleApi;
