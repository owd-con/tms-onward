import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useRemoveUserMutation,
  useUpdateUserActivateMutation,
  useUpdateUserDeactivateMutation,
  useLazyShowUserQuery,
} from "./api";
import type { User } from "../types";

export const useUser = createCrudHook<User>({
  useLazyGetQuery: useLazyGetUserQuery,
  useLazyShowQuery: useLazyShowUserQuery,
  useCreateMutation: useCreateUserMutation,
  useUpdateMutation: useUpdateUserMutation,
  useRemoveMutation: useRemoveUserMutation,
  entityName: "user",
  customOperations: {
    activate: {
      hook: useUpdateUserActivateMutation,
    },
    deactivate: {
      hook: useUpdateUserDeactivateMutation,
    },
  },
});
