import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetExceptionOrdersQuery,
  useBatchRescheduleShipmentsMutation,
  useReturnShipmentMutation,
} from "./api";

/**
 * TMS Onward - Exception Hooks
 * Uses createCrudHook for exception operations
 *
 * Note: Exception is not a standard CRUD entity - it has custom operations only:
 * - getExceptionOrders: Query orders with failed shipments
 * - batchRescheduleShipments: Batch reschedule (no id required)
 * - returnShipment: Return single shipment (requires id)
 */
export const useException = createCrudHook({
  useLazyGetQuery: useLazyGetExceptionOrdersQuery,
  entityName: "exception",
  customOperations: {
    batchRescheduleShipments: {
      hook: useBatchRescheduleShipmentsMutation,
      requiresId: false, // Takes shipment_ids array, not a single id
    },
    returnShipment: {
      hook: useReturnShipmentMutation,
      requiresId: true, // Takes shipment id
    },
  },
});

