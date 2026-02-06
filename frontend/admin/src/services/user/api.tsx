import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery,
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (params?: any) => ({
        url: `/user`,
        method: "GET",
        params,
      }),
    }),
    createUser: builder.mutation({
      query: (payload) => ({
        url: "/user",
        method: "POST",
        body: payload,
      }),
    }),
    updateUser: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/user/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),
    removeUser: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/user/${id}`,
        method: "DELETE",
        body: payload,
      }),
    }),
    updateUserActivate: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/user/${id}/activate`,
        method: "PUT",
        body: payload,
      }),
    }),
    updateUserDeactivate: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/user/${id}/deactivate`,
        method: "PUT",
        body: payload,
      }),
    }),
    showUser: builder.query({
      query: ({ id, ...params }) => ({
        url: `/user/${id}`,
        method: "GET",
        params,
      }),
    }),
  }),
});

// export hooks RTK Query
export const { useLazyGetUserQuery, useCreateUserMutation, useUpdateUserMutation, useRemoveUserMutation, useUpdateUserActivateMutation, useUpdateUserDeactivateMutation, useLazyShowUserQuery } = userApi;
