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
      query: (payload) => ({
        url: "/auth/login",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * POST /auth/register
     * Register new company & admin user
     * Body: { company_name, company_type, name, email, password, confirm_password, phone?, currency, language }
     */
    register: builder.mutation({
      query: (payload) => ({
        url: "/auth/register",
        method: "POST",
        body: payload,
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
      query: (payload) => ({
        url: "/auth/password",
        method: "PUT",
        body: payload,
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
