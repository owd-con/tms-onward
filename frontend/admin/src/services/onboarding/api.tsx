import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Onboarding API
 *
 * Provides API endpoints for onboarding wizard operations.
 * Reference: backend/src/handler/rest/onboarding/handler.go
 */

export const onboardingApi = createApi({
  reducerPath: "onboardingApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * POST /onboarding/step1
     * Update company profile (name, type)
     */
    onboardingStep1: builder.mutation({
      query: (payload) => ({
        url: "/onboarding/step1",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * POST /onboarding/step2
     * Create/update users (now accepts array)
     */
    onboardingStep2: builder.mutation({
      query: (payload) => ({
        url: "/onboarding/step2",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * POST /onboarding/step3
     * Create/update vehicles (now accepts array)
     */
    onboardingStep3: builder.mutation({
      query: (payload) => ({
        url: "/onboarding/step3",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * POST /onboarding/step4
     * Create/update drivers (now accepts array)
     */
    onboardingStep4: builder.mutation({
      query: (payload) => ({
        url: "/onboarding/step4",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * POST /onboarding/step5
     * Create/update customers (now accepts array)
     */
    onboardingStep5: builder.mutation({
      query: (payload) => ({
        url: "/onboarding/step5",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * GET /onboarding/status
     * Get onboarding status
     */
    getOnboardingStatus: builder.query({
      query: () => ({
        url: "/onboarding/status",
        method: "GET",
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useOnboardingStep1Mutation,
  useOnboardingStep2Mutation,
  useOnboardingStep3Mutation,
  useOnboardingStep4Mutation,
  useOnboardingStep5Mutation,
  useLazyGetOnboardingStatusQuery,
} = onboardingApi;
