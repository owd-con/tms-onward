import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetDriversQuery,
  useLazyShowDriverQuery,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useRemoveDriverMutation,
  useActivateDriverMutation,
  useDeactivateDriverMutation,
} from "./api";

export const useDriver = createCrudHook({
  useLazyGetQuery: useLazyGetDriversQuery,
  useLazyShowQuery: useLazyShowDriverQuery,
  useCreateMutation: useCreateDriverMutation,
  useUpdateMutation: useUpdateDriverMutation,
  useRemoveMutation: useRemoveDriverMutation,
  entityName: "driver",
  customOperations: {
    activate: {
      hook: useActivateDriverMutation,
    },
    deactivate: {
      hook: useDeactivateDriverMutation,
    },
  },
});
