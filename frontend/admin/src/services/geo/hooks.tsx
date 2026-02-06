/**
 * TMS Onward - Geo Service Hooks
 */

import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetCitiesQuery,
  useLazyGetCountriesQuery,
  useLazyGetProvincesQuery,
  useLazyGetDistrictsQuery,
  useLazyGetVillagesQuery,
  useLazyLookupLocationQuery,
} from "./api";

export const useGeo = createCrudHook<any>({
  useLazyGetQuery: useLazyLookupLocationQuery,
  entityName: "geo",
  additionalQueries: {
    getCities: useLazyGetCitiesQuery,
    getCountries: useLazyGetCountriesQuery,
    getProvinces: useLazyGetProvincesQuery,
    getDistricts: useLazyGetDistrictsQuery,
    getVillages: useLazyGetVillagesQuery,
  },
});
