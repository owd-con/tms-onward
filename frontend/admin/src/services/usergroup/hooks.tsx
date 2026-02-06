import { createCrudHook } from "../hooks/createCrudHook";
import { type UserGroup } from "../types";
import {
  useLazyGetUsergroupQuery,
  useCreateUsergroupMutation,
  useUpdateUsergroupMutation,
  useRemoveUsergroupMutation,
  useLazyShowUsergroupQuery,
} from "./api";

export const useUsergroup = createCrudHook<UserGroup>({
  useLazyGetQuery: useLazyGetUsergroupQuery,
  useLazyShowQuery: useLazyShowUsergroupQuery,
  useCreateMutation: useCreateUsergroupMutation,
  useUpdateMutation: useUpdateUsergroupMutation,
  useRemoveMutation: useRemoveUsergroupMutation,
  entityName: "usergroup",
});
