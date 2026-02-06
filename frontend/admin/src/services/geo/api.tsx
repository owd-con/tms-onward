import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

/**
 * TMS Onward - Geo Location API
 * For cascading dropdown: Country → Province → City → District → Village
 */
export const geoApi = createApi({
  reducerPath: "geoApi",
  baseQuery,
  endpoints: (builder) => ({
    /**
     * GET /geo/cities
     * Get cities with params (page, search, province_code, etc.)
     */
    getCities: builder.query({
      query: (params?: any) => ({
        url: "/geo/cities",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /geo/countries
     * Get list of all countries
     */
    getCountries: builder.query({
      query: () => ({
        url: "/geo/countries",
        method: "GET",
      }),
    }),

    /**
     * GET /geo/provinces
     * Get provinces by country code
     */
    getProvinces: builder.query({
      query: (params?: any) => ({
        url: "/geo/provinces",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /geo/districts
     * Get districts by city code
     */
    getDistricts: builder.query({
      query: (params?: any) => ({
        url: "/geo/districts",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /geo/villages
     * Get villages by district code
     */
    getVillages: builder.query({
      query: (params?: any) => ({
        url: "/geo/villages",
        method: "GET",
        params,
      }),
    }),

    /**
     * GET /geo/lookup
     * Search locations by keyword
     */
    lookupLocation: builder.query({
      query: (params?: any) => ({
        url: "/geo/lookup",
        method: "GET",
        params,
      }),
    }),
  }),
});

// Export RTK Query hooks
export const {
  useLazyGetCitiesQuery,
  useLazyGetCountriesQuery,
  useLazyGetProvincesQuery,
  useLazyGetDistrictsQuery,
  useLazyGetVillagesQuery,
  useLazyLookupLocationQuery,
} = geoApi;
