import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetOrdersQuery,
  useLazyShowOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useRemoveOrderMutation,
  useCancelOrderMutation,
  useLazyGetWaypointPreviewQuery,
} from "./api";

export const useOrder = createCrudHook({
  useLazyGetQuery: useLazyGetOrdersQuery,
  useLazyShowQuery: useLazyShowOrderQuery,
  useCreateMutation: useCreateOrderMutation,
  useUpdateMutation: useUpdateOrderMutation,
  useRemoveMutation: useRemoveOrderMutation,
  customOperations: {
    cancel: {
      hook: useCancelOrderMutation,
      errorMessage: "Failed to cancel order",
    },
  },
  additionalQueries: {
    getWaypointPreview: useLazyGetWaypointPreviewQuery,
  },
  entityName: "order",
});
