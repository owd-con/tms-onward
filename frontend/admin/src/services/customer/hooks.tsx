import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetCustomersQuery,
  useLazyShowCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useRemoveCustomerMutation,
  useActivateCustomerMutation,
  useDeactivateCustomerMutation,
} from "./api";

export const useCustomer = createCrudHook({
  useLazyGetQuery: useLazyGetCustomersQuery,
  useLazyShowQuery: useLazyShowCustomerQuery,
  useCreateMutation: useCreateCustomerMutation,
  useUpdateMutation: useUpdateCustomerMutation,
  useRemoveMutation: useRemoveCustomerMutation,
  entityName: "customer",
  customOperations: {
    activate: {
      hook: useActivateCustomerMutation,
    },
    deactivate: {
      hook: useDeactivateCustomerMutation,
    },
  },
});
