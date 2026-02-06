import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Company API
 *
 * Provides API endpoints for company management operations.
 * Reference: backend/src/handler/rest/company/handler.go
 */
export const companyApi = createApi({
  reducerPath: "companyApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /companies
     * Get current user's company information
     */
    getCompanies: builder.query({
      query: (params?: any) => ({
        url: "/companies",
        method: "GET",
        params,
      }),
    }),

    /**
     * PUT /companies
     * Update company information
     * Requires "tms.company.manage" permission
     */
    updateCompanies: builder.mutation({
      query: (payload) => ({
        url: "/companies",
        method: "PUT",
        body: payload,
      }),
    }),

    /**
     * POST /companies/onboarding
     * Mark company onboarding as completed
     */
    completeOnboarding: builder.mutation({
      query: () => ({
        url: "/companies/onboarding",
        method: "POST",
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazyGetCompaniesQuery,
  useUpdateCompaniesMutation,
  useCompleteOnboardingMutation,
} = companyApi;
