import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetAddressesQuery,
  useLazyShowAddressQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useRemoveAddressMutation,
} from "./api";

export const useAddress = createCrudHook({
  useLazyGetQuery: useLazyGetAddressesQuery,
  useLazyShowQuery: useLazyShowAddressQuery,
  useCreateMutation: useCreateAddressMutation,
  useUpdateMutation: useUpdateAddressMutation,
  useRemoveMutation: useRemoveAddressMutation,
  entityName: "address",
});
