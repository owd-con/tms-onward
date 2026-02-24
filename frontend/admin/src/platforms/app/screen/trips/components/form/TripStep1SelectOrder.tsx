import { RemoteSelect } from "@/components";
import type { Order } from "@/services/types";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";

interface TripStep1SelectOrderProps {
  selectedOrder: Order | null;
  onOrderChange: (order: Order | null) => void;
  onReset: () => void; // Reset subsequent steps when order changes
  getOrdersResult: any;
  onFetchOrders: (page?: number, search?: string) => void;
}

const TripStep1SelectOrder: React.FC<TripStep1SelectOrderProps> = ({
  selectedOrder,
  onOrderChange,
  onReset,
  getOrdersResult,
  onFetchOrders,
}) => {
  const FormState = useSelector((state: RootState) => state.form);

  const handleOrderChange = (order: Order | null) => {
    onOrderChange(order);
    onReset();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Step 1: Select Order</h3>
      <p className="text-sm text-base-content/60 mb-4">
        Select a pending order to create a trip for. Only orders with &quot;Pending&quot;
        status can be assigned.
      </p>

      <RemoteSelect<Order>
        label="Order"
        placeholder="Select a pending order"
        value={selectedOrder}
        onChange={handleOrderChange}
        fetchData={onFetchOrders}
        hook={getOrdersResult}
        getLabel={(item: Order) => {
          return `${item.order_number} - ${item.customer?.name || "Unknown"} (${item.order_type})`;
        }}
        getValue={(item: Order) => item?.id || ""}
        error={FormState?.errors?.order_id as string}
        required
        renderItem={(item: Order) => (
          <div className="flex flex-col">
            <span className="font-medium">{item.order_number}</span>
            <span className="text-xs text-base-content/60">
              {item.customer?.name || "Unknown"} • {item.order_type} •{" "}
              {item.order_waypoints?.length || 0} waypoints
            </span>
          </div>
        )}
      />
    </div>
  );
};

export default TripStep1SelectOrder;
