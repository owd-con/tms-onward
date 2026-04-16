import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../baseQuery";

/**
 * TMS Driver - Authentication API
 */
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * POST /auth/login
     * User login with identifier and password
     */
    login: builder.mutation({
      query: (credentials: {
        identifier: string;
        password: string;
        apps: string;
      }) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    /**
     * POST /auth/register
     * Register new driver account
     */
    signupDriver: builder.mutation({
      query: (data: {
        username: string;
        name: string;
        phone: string;
        password: string;
        confirm_password: string;
      }) => ({
        url: "/auth/register",
        method: "POST",
        body: {
          ...data,
          role: "driver",
        },
      }),
    }),

    /**
     * POST /auth/logout
     * Logout user and invalidate session
     */
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    /**
     * GET /me
     * Get current user profile
     */
    getProfile: builder.query({
      query: () => ({
        url: "/me",
        method: "GET",
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLoginMutation,
  useSignupDriverMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
} = authApi;
