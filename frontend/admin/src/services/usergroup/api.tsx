import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

export const usergroupApi = createApi({
  reducerPath: "usergroupApi",
  baseQuery,
  endpoints: (builder) => ({
    getUsergroup: builder.query({
      query: (params?: any) => ({
        url: `/usergroup`,
        method: "GET",
        params,
      }),
    }),
    createUsergroup: builder.mutation({
      query: (payload) => ({
        url: "/usergroup",
        method: "POST",
        body: payload,
      }),
    }),
    updateUsergroup: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/usergroup/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),
    removeUsergroup: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/usergroup/${id}`,
        method: "DELETE",
        body: payload,
      }),
    }),
    showUsergroup: builder.query({
      query: ({ id, ...params }) => ({
        url: `/usergroup/${id}`,
        method: "GET",
        params,
      }),
    }),
  }),
});

// export hooks RTK Query
export const {
  useLazyGetUsergroupQuery,
  useCreateUsergroupMutation,
  useUpdateUsergroupMutation,
  useRemoveUsergroupMutation,
  useLazyShowUsergroupQuery,
} = usergroupApi;
