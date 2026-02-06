import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetVehiclesQuery,
  useLazyShowVehicleQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useRemoveVehicleMutation,
  useActivateVehicleMutation,
  useDeactivateVehicleMutation,
} from "./api";

export const useVehicle = createCrudHook({
  useLazyGetQuery: useLazyGetVehiclesQuery,
  useLazyShowQuery: useLazyShowVehicleQuery,
  useCreateMutation: useCreateVehicleMutation,
  useUpdateMutation: useUpdateVehicleMutation,
  useRemoveMutation: useRemoveVehicleMutation,
  entityName: "vehicle",
  customOperations: {
    activate: {
      hook: useActivateVehicleMutation,
    },
    deactivate: {
      hook: useDeactivateVehicleMutation,
    },
  },
});
