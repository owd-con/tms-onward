import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../baseQuery';

/**
 * TMS Onward - Public Tracking API
 * For public order tracking (no authentication required)
 */
export const trackingApi = createApi({
  reducerPath: 'trackingApi',
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /public/tracking/:orderNumber
     * Get tracking information by order number
     */
    getTrackingByOrderNumber: builder.query({
      query: (orderNumber) => ({
        url: `/public/tracking/${orderNumber}`,
        method: 'GET',
      }),
    }),
  }),
});

// Export RTK Query hooks
export const { useLazyGetTrackingByOrderNumberQuery } = trackingApi;
