import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetPricingMatricesQuery,
  useLazyShowPricingMatrixQuery,
  useCreatePricingMatrixMutation,
  useUpdatePricingMatrixMutation,
  useDeletePricingMatrixMutation,
} from "./api";

export const usePricingMatrix = createCrudHook({
  useLazyGetQuery: useLazyGetPricingMatricesQuery,
  useLazyShowQuery: useLazyShowPricingMatrixQuery,
  useCreateMutation: useCreatePricingMatrixMutation,
  useUpdateMutation: useUpdatePricingMatrixMutation,
  useRemoveMutation: useDeletePricingMatrixMutation,
  entityName: "pricingMatrix",
});
