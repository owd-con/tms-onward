import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery,
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: (params?: any) => ({
        url: `/dashboard`,
        method: "GET",
        params,
      }),
    }),
  }),
});

// export hooks RTK Query
export const {
  useLazyGetDashboardQuery,
} = dashboardApi;
