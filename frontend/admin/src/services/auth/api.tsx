import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../baseQuery";

/**
 * TMS Onward - Authentication API
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
      query: (credentials: { identifier: string; password: string }) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    /**
     * POST /auth/register
     * Register new company & admin user
     * Body: { company_name, company_type, name, email, password, confirm_password, phone?, currency, language }
     */
    register: builder.mutation({
      query: (data: {
        company_name: string;
        company_type: "3PL" | "Carrier";
        username: string;
        name: string;
        email: string;
        password: string;
        confirm_password: string;
        phone?: string;
        currency: string;
        language: string;
      }) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
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
     * POST /auth/refresh
     * Refresh access token
     */
    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
    }),

    /**
     * PUT /auth/password
     * Change password for current user
     * Body: { old_password, new_password, confirm_new_password }
     */
    changePassword: builder.mutation({
      query: (data: {
        old_password: string;
        new_password: string;
        confirm_new_password: string;
      }) => ({
        url: "/auth/password",
        method: "PUT",
        body: data,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useChangePasswordMutation,
} = authApi;
