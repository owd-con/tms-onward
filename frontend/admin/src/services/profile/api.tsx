import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery,
  endpoints: (builder) => ({
    getMe: builder.query({
      query: (params) => ({
        url: `/me`,
        method: "GET",
        params,
      }),
    }),
    updateMe: builder.mutation({
      query: (payload) => ({
        url: "/me",
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

// export hooks RTK Query
export const { useLazyGetMeQuery, useUpdateMeMutation } = profileApi;
