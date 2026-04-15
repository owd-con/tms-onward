import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetAddressesQuery,
  useLazyShowAddressQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useRemoveAddressMutation,
  useActivateAddressMutation,
  useDeactivateAddressMutation,
} from "./api";

export const useAddress = createCrudHook({
  useLazyGetQuery: useLazyGetAddressesQuery,
  useLazyShowQuery: useLazyShowAddressQuery,
  useCreateMutation: useCreateAddressMutation,
  useUpdateMutation: useUpdateAddressMutation,
  useRemoveMutation: useRemoveAddressMutation,
  entityName: "address",
  customOperations: {
    activate: {
      hook: useActivateAddressMutation,
    },
    deactivate: {
      hook: useDeactivateAddressMutation,
    },
  },
});